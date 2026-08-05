import { onRequestPost as __api_contact_ts_onRequestPost } from "C:\\Users\\skilo\\Documents\\smart-toolkit\\functions\\api\\contact.ts"

export const routes = [
    {
      routePath: "/api/contact",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_contact_ts_onRequestPost],
    },
  ]