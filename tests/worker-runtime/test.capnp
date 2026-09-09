using Workerd = import "../../node_modules/workerd/workerd.capnp";
const config :Workerd.Config = (services = [
  (name = "relay", worker = (
    compatibilityDate = "2026-09-01",
    modules = [
      (name = "test.mjs", esModule = embed "test.mjs"),
      (name = "app.mjs", esModule = embed "../../dist/server/index.js")
    ],
    globalOutbound = "provider-stub"
  )),
  (name = "provider-stub", worker = (
    compatibilityDate = "2026-09-01",
    modules = [(name = "provider.mjs", esModule = embed "provider.mjs")]
  ))
]);
