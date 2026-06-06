// tina/config.ts
import { defineConfig } from "tinacms";
var config_default = defineConfig({
  branch: "main",
  clientId: null,
  token: null,
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  // 🔐 本地开发模式：跳过 Tina Cloud 鉴权
  //   生产构建出来的 /admin/index.html 仍然能跑，
  //   只是云端没有后端，读写会被拦截 → 提示用户用本地 dev 编辑
  auth: {
    useLocalAuth: true
  },
  local: {
    backend: {
      url: "http://localhost:4321"
    }
  },
  media: {
    tina: {
      mediaRoot: "images/products",
      publicFolder: "public"
    }
  },
  schema: {
    collections: [
      {
        name: "products",
        label: "FOIDA \uFFFD\uFFFD\u01B7\uFFFD\u03FC\u0739\uFFFD\uFFFD\uFFFD",
        path: "src/content/products",
        format: "json",
        fields: [
          { type: "string", name: "title", label: "\uFFFD\uFFFD\u01B7\uFFFD\u037A\uFFFD/\uFFFD\uFFFD\uFFFD\uFFFD (\uFFFD\uFFFD FOIDA RIB 330)", required: true },
          { type: "image", name: "image", label: "\uFFFD\uFFFD\u01B7\uFFFD\uFFFD\uFFFD\uFFFD\u0579\u02BE\uFFFD\uFFFD\u037C" },
          { type: "string", name: "length", label: "\uFFFD\uFFFD\uFFFD\u5CE4\uFFFD\uFFFD (\uFFFD\uFFFD\uFFFD\uFFFD: 3.3m)" },
          { type: "string", name: "material", label: "\uFFFD\uFFFD\uFFFD\u03F9\uFFFD\uFFFD\uFFFD (\uFFFD\uFFFD\uFFFD\uFFFD: 1.2mm PVC)" },
          { type: "string", name: "maxLoad", label: "\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD (\uFFFD\uFFFD\uFFFD\uFFFD: 650kg)" },
          {
            type: "object",
            name: "seo",
            label: "?? \uFFFD\u0238\uFFFD SEO \uFFFD\u017B\uFFFD\u0461\uFFFD\uFFFD (TDK)",
            fields: [
              { type: "string", name: "metaTitle", label: "SEO \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD (Meta Title)" },
              { type: "string", name: "metaDescription", label: "SEO \uFFFD\uFFFD\u04B3\uFFFD\uFFFD\uFFFD\uFFFD (Meta Description)", ui: { component: "textarea" } }
            ]
          }
        ]
      },
      {
        name: "post",
        label: "FOIDA \uFFFD\u0677\uFFFD Blog \uFFFD\uFFFD\uFFFD\uFFFD",
        path: "src/content/post",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "\uFFFD\uFFFD\uFFFD\xB1\uFFFD\uFFFD\uFFFD", required: true, isTitle: true },
          { type: "datetime", name: "publishDate", label: "\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD" },
          { type: "image", name: "image", label: "\uFFFD\uFFFD\uFFFD\u0377\uFFFD\uFFFD\uFFFD\uFFFD\u037C" },
          { type: "string", name: "excerpt", label: "\uFFFD\uFFFD\uFFFD\uFFFD\u056A\u04AA (\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u0130\uFFFD)", ui: { component: "textarea" } },
          { type: "rich-text", name: "body", label: "\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD", isBody: true },
          {
            type: "object",
            name: "seo",
            label: "?? \uFFFD\u0238\uFFFD SEO \uFFFD\u017B\uFFFD\u0461\uFFFD\uFFFD (TDK)",
            fields: [
              { type: "string", name: "metaTitle", label: "SEO \uFFFD\uFFFD\uFFFD\uFFFD" },
              { type: "string", name: "metaDescription", label: "SEO \uFFFD\uFFFD\uFFFD\uFFFD", ui: { component: "textarea" } }
            ]
          }
        ]
      }
    ]
  }
});
export {
  config_default as default
};
