#!/usr/bin/env node

const sharedScope = {
  default: {
    react: {
      version: "18.2.0",
      singleton: true,
      origin: "host",
      instance: { runtimeId: "host-react-singleton" },
    },
    "react-dom": {
      version: "18.2.0",
      singleton: true,
      origin: "host",
      instance: { runtimeId: "host-react-dom-singleton" },
    },
  },
};

function createRemoteContainer(name, options) {
  let initializedScope = null;

  return {
    async init(scope) {
      initializedScope = scope;
      console.log(`[remote:${name}] init() called`);
      for (const dependency of Object.keys(options.shared)) {
        const provided = scope[dependency];
        if (provided) {
          console.log(
            `[remote:${name}] shared dependency satisfied: ${dependency}@${provided.version} from ${provided.origin}`,
          );
        } else {
          console.log(
            `[remote:${name}] shared dependency missing: ${dependency}; remote would need bundled fallback`,
          );
        }
      }
    },

    async get(request) {
      console.log(`[remote:${name}] get(${request}) called`);
      const factory = options.modules[request];
      if (!factory) {
        throw new Error(`Remote module not found: ${request}`);
      }
      return () => factory(initializedScope);
    },
  };
}

async function initializeHostSharing(scopeName) {
  console.log(`[host] __webpack_init_sharing__(${scopeName})`);
  return sharedScope[scopeName];
}

async function loadRemoteModule(scopeName, container, request) {
  const scope = await initializeHostSharing(scopeName);
  await container.init(scope);
  const factory = await container.get(request);
  const moduleExports = factory();
  console.log(`[host] module ${request} evaluated`);
  return moduleExports;
}

const checkoutRemote = createRemoteContainer("checkout", {
  shared: {
    react: { singleton: true, requiredVersion: "^18.0.0" },
    "react-dom": { singleton: true, requiredVersion: "^18.0.0" },
  },
  modules: {
    "./CartPanel": (scope) => ({
      default: {
        kind: "component",
        name: "CartPanel",
        renderedBy: "checkout",
      },
      metadata: {
        reusedReactRuntimeId: scope.react?.instance.runtimeId ?? null,
      },
    }),
    "./formatPrice": () => ({
      formatPrice(value) {
        return `$${value.toFixed(2)}`;
      },
    }),
  },
});

const cartPanel = await loadRemoteModule("default", checkoutRemote, "./CartPanel");
console.log("[host] cart panel module:", JSON.stringify(cartPanel, null, 2));

const pricingUtils = await loadRemoteModule("default", checkoutRemote, "./formatPrice");
console.log("[host] formatPrice(12.5):", pricingUtils.formatPrice(12.5));
