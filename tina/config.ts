import { defineConfig } from "tinacms";

export default defineConfig({
  branch: "main",
  clientId: null,
  token: null,
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  // 🔐 本地开发模式：跳过 Tina Cloud 鉴权
  //   生产构建出来的 /admin/index.html 仍然能跑，
  //   只是云端没有后端，读写会被拦截 → 提示用户用本地 dev 编辑
  auth: {
    useLocalAuth: true,
  },
  local: {
    backend: {
      url: "http://localhost:4321",
    },
  },
  media: {
    tina: {
      mediaRoot: "images/products",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      {
        name: "products",
        label: "FOIDA ��Ʒ�ϼܹ���",
        path: "src/content/products",
        format: "json",
        fields: [
          { type: "string", name: "title", label: "��Ʒ�ͺ�/���� (�� FOIDA RIB 330)", required: true },
          { type: "image", name: "image", label: "��Ʒ����չʾ��ͼ" },
          { type: "string", name: "length", label: "���峤�� (����: 3.3m)" },
          { type: "string", name: "material", label: "���Ϲ��� (����: 1.2mm PVC)" },
          { type: "string", name: "maxLoad", label: "������ (����: 650kg)" },
          {
            type: "object",
            name: "seo",
            label: "?? �ȸ� SEO �Ż�ѡ�� (TDK)",
            fields: [
              { type: "string", name: "metaTitle", label: "SEO �������� (Meta Title)" },
              { type: "string", name: "metaDescription", label: "SEO ��ҳ���� (Meta Description)", ui: { component: "textarea" } },
            ],
          },
        ],
      },
      {
        name: "post",
        label: "FOIDA �ٷ� Blog ����",
        path: "src/content/post",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "���±���", required: true, isTitle: true },
          { type: "datetime", name: "publishDate", label: "��������" },
          { type: "image", name: "image", label: "���ͷ����ͼ" },
          { type: "string", name: "excerpt", label: "����ժҪ (��������İ�)", ui: { component: "textarea" } },
          { type: "rich-text", name: "body", label: "��������", isBody: true },
          {
            type: "object",
            name: "seo",
            label: "?? �ȸ� SEO �Ż�ѡ�� (TDK)",
            fields: [
              { type: "string", name: "metaTitle", label: "SEO ����" },
              { type: "string", name: "metaDescription", label: "SEO ����", ui: { component: "textarea" } },
            ],
          },
        ],
      },
    ],
  },
});
