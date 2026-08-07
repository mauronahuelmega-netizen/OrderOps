const objectUrl =
  "https://pkrsedmwxekbhlohhqds.supabase.co/storage/v1/object/public/business-assets/e21b8fc2-3016-4dec-92ef-ebb04e58ecdf/logo/1783648516989-adeeaccb-e47e-4f-b404-2b91e9293f39.png";

// Fix typo if any - use exact from CDP
const exact =
  "https://pkrsedmwxekbhlohhqds.supabase.co/storage/v1/object/public/business-assets/e21b8fc2-3016-4dec-92ef-ebb04e58ecdf/logo/1783648516989-adeeaccb-e47e-4e4f-b404-2b91e9293f39.png";

const renderUrl =
  exact.replace("/object/public/", "/render/image/public/") +
  "?width=64&height=64&resize=cover";

for (const [label, url] of [
  ["object", exact],
  ["render", renderUrl]
]) {
  const r = await fetch(url, { method: "GET" });
  const buf = Buffer.from(await r.arrayBuffer());
  const text = buf.slice(0, 200).toString("utf8");
  console.log(
    JSON.stringify({
      label,
      status: r.status,
      bytes: buf.length,
      featureNotEnabled: /FeatureNotEnabled/i.test(text),
      snippet: text.replace(/\s+/g, " ").slice(0, 140)
    })
  );
}
