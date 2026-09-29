export const pageHead = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} — Santos MktPro` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Santos MktPro` },
    { property: "og:description", content: description },
  ],
});
