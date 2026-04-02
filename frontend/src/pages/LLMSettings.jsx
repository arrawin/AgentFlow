import { useEffect, useState } from "react";
import api from "../api/client";

function AnthropicIcon() {
  return (
    <svg fill="currentColor" fillRule="evenodd" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z"/>
    </svg>
  );
}
function OpenAIIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M99.9616 56.4829C100.671 54.3804 101.032 52.1791 101.033 49.9633C101.032 46.2968 100.043 42.6964 98.1649 39.5324C94.392 33.0524 87.3931 29.0517 79.8185 29.0517C78.3262 29.0517 76.8381 29.2073 75.3789 29.5157C73.4163 27.3339 71.0072 25.5873 68.3105 24.3913C65.6139 23.1952 62.6909 22.5767 59.7343 22.5767H59.6015L59.5517 22.5769C50.3774 22.5769 42.2414 28.418 39.4212 37.0291C36.5018 37.619 33.7439 38.8175 31.332 40.5443C28.9201 42.2711 26.9099 44.4863 25.436 47.0418C23.564 50.2248 22.5776 53.8394 22.5764 57.5195C22.5771 62.6915 24.5229 67.6793 28.0369 71.517C27.3276 73.6194 26.9658 75.8207 26.9655 78.0366C26.9659 81.7031 27.9557 85.3034 29.8333 88.4675C32.0661 92.3033 35.4758 95.3402 39.5709 97.1405C43.6659 98.9407 48.2346 99.4111 52.6181 98.4839C54.581 100.666 56.9903 102.412 59.6871 103.608C62.384 104.805 65.3072 105.423 68.2639 105.423H68.3967L68.4507 105.423C77.6299 105.423 85.7632 99.5816 88.5835 90.9627C91.5028 90.3725 94.2607 89.1739 96.6727 87.4471C99.0846 85.7203 101.095 83.5051 102.569 80.9497C104.439 77.7695 105.423 74.1579 105.423 70.4812C105.422 65.3093 103.476 60.3216 99.9624 56.4841L99.9616 56.4829ZM68.402 100.007H68.3803C64.7073 100.006 61.1509 98.7344 58.3296 96.4139C58.4971 96.3249 58.6627 96.2323 58.8261 96.1362L75.5442 86.608C75.9614 86.3737 76.3084 86.0346 76.5497 85.6251C76.7911 85.2157 76.9183 84.7505 76.9185 84.2768V61.0054L83.9848 65.0312C84.0219 65.0494 84.0538 65.0764 84.0778 65.1098C84.1018 65.1431 84.1171 65.1818 84.1223 65.2224V84.4813C84.1126 93.0437 77.0806 99.9897 68.402 100.007ZM34.595 85.7603C33.214 83.4043 32.4865 80.731 32.4856 78.0094C32.4856 77.1217 32.5641 76.2318 32.7171 75.3571C32.8414 75.4306 33.0584 75.5613 33.214 75.6495L49.9321 85.1777C50.3489 85.4178 50.8229 85.5443 51.3055 85.5442C51.7882 85.5441 52.2621 85.4174 52.6788 85.1772L73.0898 73.5485V81.6005L73.0901 81.6144C73.0901 81.6532 73.081 81.6914 73.0634 81.7261C73.0459 81.7608 73.0204 81.791 72.989 81.8143L56.0885 91.4423C53.6972 92.8002 50.9866 93.5153 48.2275 93.5161C45.4655 93.5157 42.7521 92.7988 40.3594 91.4374C37.9667 90.076 35.9788 88.1179 34.595 85.7594V85.7603ZM30.1968 49.749C32.0329 46.6021 34.9322 44.1926 38.3873 42.9422C38.3873 43.0842 38.3791 43.3358 38.3791 43.5105V62.5672L38.3788 62.5828C38.3788 63.056 38.5058 63.5207 38.7468 63.9298C38.9878 64.3389 39.3343 64.6778 39.7509 64.912L60.162 76.5389L53.0959 80.5648C53.0611 80.5874 53.0211 80.6013 52.9795 80.605C52.9379 80.6087 52.896 80.6023 52.8576 80.5862L35.9554 70.9501C33.566 69.5843 31.5824 67.6229 30.2034 65.2625C28.8243 62.902 28.0982 60.2253 28.0979 57.5007C28.099 54.7804 28.823 52.1079 30.1976 49.7498L30.1968 49.749ZM88.2537 63.0795L67.8427 51.4511L74.909 47.4267C74.9439 47.404 74.9839 47.3902 75.0255 47.3865C75.067 47.3827 75.1089 47.3892 75.1473 47.4053L92.0492 57.0333C94.4406 58.3969 96.4263 60.3573 97.807 62.7175C99.1878 65.0778 99.9149 67.7549 99.9155 70.4801C99.9155 76.9846 95.802 82.8049 89.6168 85.0514V65.4248C89.6177 65.4176 89.6177 65.4101 89.6177 65.4029C89.6176 64.9314 89.4914 64.4684 89.2519 64.0604C89.0124 63.6525 88.6681 63.3141 88.2537 63.0795ZM95.2869 52.6349C95.1226 52.5356 94.9571 52.4382 94.7904 52.3428L78.0722 42.8143C77.6554 42.5747 77.1816 42.4483 76.6992 42.4481C76.2168 42.4483 75.743 42.5747 75.3262 42.8143L54.9148 54.4429V46.391L54.9145 46.3771C54.9145 46.2984 54.9524 46.2244 55.016 46.1772L71.9164 36.5573C74.3069 35.1975 77.0178 34.4816 79.7771 34.4815C88.4668 34.4815 95.5138 41.4347 95.5138 50.0087C95.5134 50.8886 95.4375 51.7668 95.2869 52.6341V52.6349ZM51.073 66.9861L44.0052 62.9603C43.9681 62.942 43.9362 62.915 43.9122 62.8817C43.8882 62.8483 43.8729 62.8097 43.8677 62.7691V43.5099C43.8715 34.9405 50.9185 27.9931 59.6044 27.9931C63.2832 27.9939 66.8455 29.2654 69.6733 31.5871C69.5461 31.6557 69.3242 31.7766 69.1768 31.8648L52.4586 41.393C52.0415 41.6272 51.6947 41.9662 51.4533 42.3755C51.212 42.7848 51.0848 43.2498 51.0847 43.7234V43.7387L51.073 66.9861ZM54.9116 58.8202L64.0023 53.6395L73.093 58.8167V69.1748L64.0023 74.3523L54.9116 69.1748V58.8202Z" fill="currentColor"/>
    </svg>
  );
}
function GeminiIcon() {
  // Gemini star — four-pointed star with gradient feel
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C11.1 6.5 9.5 8.5 2 12c7.5 3.5 9.1 5.5 10 10 .9-4.5 2.5-6.5 10-10C14.5 8.5 12.9 6.5 12 2z"/>
    </svg>
  );
}
function GroqIcon() {
  // Groq — lightning bolt (speed)
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
function OllamaIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 75 74" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M24.7031 3.36019C25.3781 3.62227 25.9875 4.05394 26.5406 4.62436C27.4625 5.56786 28.2406 6.91836 28.8344 8.51861C29.4313 10.1281 29.8188 11.9103 29.9656 13.6986C31.9332 12.6003 34.1167 11.9316 36.3688 11.7376L36.5281 11.7253C39.2469 11.5094 41.9344 11.9935 44.2781 13.1868C44.5938 13.3502 44.9031 13.5259 45.2063 13.7109C45.3625 11.9565 45.7438 10.2144 46.3313 8.64194C46.925 7.03861 47.7031 5.69119 48.6219 4.74461C49.1353 4.19659 49.7634 3.76524 50.4625 3.48044C51.2656 3.17211 52.1188 3.11661 52.95 3.35094C54.2031 3.70244 55.2781 4.48561 56.125 5.62336C56.9 6.66244 57.4813 7.99444 57.8781 9.59161C58.5969 12.4714 58.7219 16.2609 58.2375 20.8304L58.4031 20.9537L58.4844 21.0123C60.85 22.7883 62.4969 25.3197 63.3688 28.2581C64.7281 32.843 64.0438 37.986 61.7 40.8628L61.6438 40.9275L61.65 40.9368C62.9531 43.2863 63.7438 45.7684 63.9125 48.3368L63.9188 48.4293C64.1188 51.713 63.2938 55.0184 61.375 58.2651L61.3531 58.2959L61.3844 58.3699C62.8594 61.9374 63.3219 65.5294 62.7531 69.1184L62.7344 69.2387C62.6463 69.7629 62.351 70.2313 61.9134 70.5411C61.4758 70.8509 60.9316 70.9769 60.4 70.8914C60.1368 70.8508 59.8843 70.7594 59.6569 70.6224C59.4296 70.4854 59.2318 70.3055 59.0751 70.093C58.9183 69.8804 58.8056 69.6395 58.7434 69.3839C58.6812 69.1283 58.6707 68.8631 58.7125 68.6035C59.2344 65.4184 58.7438 62.2241 57.2125 58.9743C57.0696 58.6724 57.0062 58.3398 57.028 58.0073C57.0499 57.6748 57.1563 57.353 57.3375 57.0719L57.35 57.0534C59.2375 54.2044 60.0188 51.4109 59.85 48.6667C59.7063 46.2648 58.8344 43.906 57.35 41.6583C57.0613 41.2213 56.9585 40.6898 57.0637 40.1786C57.169 39.6674 57.4739 39.2176 57.9125 38.9264L57.9406 38.9079C58.7 38.4177 59.4 37.1659 59.7531 35.4546C60.1428 33.4311 60.041 31.3453 59.4563 29.3681C58.8156 27.2098 57.6438 25.4091 56.0031 24.1789C54.1438 22.779 51.6813 22.1038 48.5656 22.298C48.1582 22.3242 47.7522 22.2291 47.4002 22.0252C47.0481 21.8213 46.7661 21.5178 46.5906 21.1541C45.6094 19.1037 44.1781 17.636 42.3938 16.7264C40.6806 15.8828 38.7627 15.5283 36.8563 15.7028C32.9656 16.008 29.5344 18.1725 28.5125 20.9013C28.3679 21.2853 28.1079 21.6166 27.7672 21.8508C27.4265 22.085 27.0215 22.2109 26.6063 22.2117C23.2719 22.2179 20.6906 22.9887 18.8031 24.3793C17.1719 25.5818 16.0594 27.2622 15.4719 29.2756C14.9402 31.1708 14.8675 33.1627 15.2594 35.0908C15.6094 36.8113 16.2938 38.2358 17.0781 39.0035L17.1031 39.0251C17.7656 39.6634 17.9063 40.6593 17.4438 41.4455C16.3188 43.3634 15.4781 46.2216 15.3406 48.9689C15.1844 52.1077 15.9219 54.8334 17.5875 56.7882L17.6375 56.8468C17.8889 57.1358 18.0505 57.4901 18.1032 57.8674C18.1558 58.2447 18.0972 58.629 17.9344 58.9743C16.1344 62.7853 15.5813 65.9179 16.1781 68.3846C16.2854 68.8975 16.1856 69.4315 15.8999 69.8729C15.6142 70.3143 15.1652 70.6283 14.6485 70.748C14.1317 70.8678 13.588 70.7838 13.1331 70.514C12.6781 70.2442 12.3478 69.8099 12.2125 69.3034C11.4531 66.1646 11.9688 62.5694 13.6906 58.5179L13.7344 58.41L13.7094 58.373C12.8631 57.1397 12.2315 55.7756 11.8406 54.3369L11.825 54.2784C11.3507 52.4835 11.164 50.6264 11.2719 48.7746C11.4094 45.9688 12.1406 43.0951 13.2156 40.7888L13.2531 40.7086L13.2469 40.7024C12.3312 39.4136 11.6531 37.764 11.2781 35.9387L11.2625 35.8647C10.7458 33.3186 10.8454 30.6882 11.5531 28.1872C12.3719 25.3659 13.9812 22.9424 16.3531 21.1911C16.5406 21.0524 16.7375 20.9136 16.9344 20.7841C16.4375 16.1807 16.5625 12.3666 17.2844 9.46827C17.6813 7.87111 18.2656 6.53911 19.0406 5.50002C19.8844 4.36536 20.9594 3.58219 22.2125 3.22761C23.0438 2.99327 23.9 3.04569 24.7031 3.35711V3.36019ZM37.5656 31.3877C40.4906 31.3877 43.1906 32.3528 45.2094 34.0239C47.1781 35.6489 48.35 37.8319 48.35 40.0056C48.35 42.7436 47.0813 44.8773 44.8094 46.2401C42.8719 47.3964 40.275 47.9575 37.3 47.9575C34.1469 47.9575 31.4531 47.1589 29.5094 45.6944C27.5813 44.2452 26.5 42.2102 26.5 40.0056C26.5 37.8257 27.7438 35.6365 29.8 34.0054C31.8875 32.3497 34.6438 31.3877 37.5656 31.3877ZM37.5656 34.1504C35.3976 34.1317 33.2871 34.8381 31.5781 36.1545C30.1375 37.2954 29.3219 38.7291 29.3219 40.0087C29.3219 41.3284 29.9781 42.5648 31.2281 43.5052C32.65 44.5751 34.7406 45.1949 37.3 45.1949C39.7969 45.1949 41.9031 44.7416 43.3375 43.8814C44.7844 43.018 45.525 41.7662 45.525 40.0056C45.525 38.7014 44.7563 37.2614 43.3906 36.1329C41.8781 34.8842 39.8281 34.1504 37.5656 34.1504ZM39.6344 37.8812L39.6469 37.8935C40.0219 38.3591 39.9438 39.0344 39.4719 39.4044L38.5594 40.1135V41.4887C38.5577 41.7948 38.4331 42.0878 38.2128 42.3034C37.9926 42.519 37.6946 42.6396 37.3844 42.6388C37.0741 42.6396 36.7762 42.519 36.5559 42.3034C36.3357 42.0878 36.211 41.7948 36.2094 41.4887V40.0704L35.3625 39.3982C35.2508 39.3099 35.1579 39.2006 35.0892 39.0767C35.0205 38.9527 34.9774 38.8166 34.9623 38.6762C34.9472 38.5357 34.9604 38.3937 35.0012 38.2583C35.042 38.1229 35.1096 37.9968 35.2 37.8874C35.3845 37.6658 35.6501 37.525 35.9391 37.4956C36.2282 37.4661 36.5173 37.5504 36.7438 37.7301L37.4156 38.2604L38.1031 37.7239C38.3288 37.548 38.6151 37.4661 38.9012 37.4954C39.1872 37.5248 39.4503 37.6632 39.6344 37.8812ZM23.8844 31.9643C25.3781 31.9643 26.5938 33.1668 26.5938 34.6499C26.5946 35.3608 26.3094 36.0429 25.8008 36.5465C25.2922 37.05 24.6018 37.3338 23.8813 37.3354C23.1618 37.333 22.4727 37.0493 21.9649 36.5465C21.457 36.0437 21.1719 35.3628 21.1719 34.6529C21.1702 33.942 21.4546 33.2595 21.9627 32.7554C22.4707 32.2513 23.1639 31.9667 23.8844 31.9643ZM51.0906 31.9643C52.5906 31.9643 53.8031 33.1668 53.8031 34.6499C53.804 35.3608 53.5187 36.0429 53.0101 36.5465C52.5015 37.05 51.8111 37.3338 51.0906 37.3354C50.3712 37.333 49.6821 37.0493 49.1742 36.5465C48.6664 36.0437 48.3812 35.3628 48.3813 34.6529C48.3796 33.942 48.664 33.2595 49.172 32.7554C49.68 32.2513 50.3701 31.9667 51.0906 31.9643ZM23.25 7.09102L23.2406 7.09719C22.8786 7.25252 22.5695 7.50724 22.35 7.83102L22.3344 7.84952C21.9031 8.43227 21.5281 9.28944 21.2469 10.4149C20.7156 12.5485 20.5719 15.4438 20.8594 18.9927C22.2031 18.598 23.6688 18.3514 25.2469 18.2619L25.2781 18.2589L25.3375 18.154C25.4813 17.9012 25.6344 17.6576 25.8 17.4171C26.1844 15.0399 25.8688 12.2001 25.0094 9.88144C24.5906 8.75911 24.0813 7.87727 23.5938 7.37469C23.4931 7.2702 23.381 7.17712 23.2594 7.09719L23.25 7.09102ZM51.9188 7.21436L51.9125 7.21744C51.7909 7.29737 51.6788 7.39045 51.5781 7.49494C51.0906 7.99752 50.5781 8.88244 50.1625 10.0048C49.2563 12.4529 48.9531 15.4808 49.4438 17.9351L49.625 18.2342L49.65 18.2774H49.7438C51.2947 18.2778 52.8375 18.4979 54.325 18.931C54.5938 15.4654 54.4438 12.6318 53.925 10.5382C53.6438 9.41277 53.2688 8.55561 52.8344 7.97286L52.8219 7.95436C52.6029 7.62943 52.2937 7.3736 51.9313 7.21744H51.9188V7.21436Z" fill="currentColor"/>
    </svg>
  );
}

const PROVIDER_ICONS = { anthropic: <AnthropicIcon />, openai: <OpenAIIcon />, gemini: <GeminiIcon />, groq: <GroqIcon />, ollama: <OllamaIcon /> };

export default function LLMSettings() {
  const [configs, setConfigs] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("groq");
  const [form, setForm] = useState({ model: "", api_key: "", base_url: "", temperature: 0.7, max_tokens: 2048 });
  const [msg, setMsg] = useState({ text: "", ok: true });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const reload = () => api.get("/llm-configs").then(r => setConfigs(r.data));
  useEffect(() => { reload(); }, []);

  const handleSave = async () => {
    setMsg({ text: "", ok: true });
    try {
      await api.post("/llm-configs", { ...form, provider: selectedProvider });
      setMsg({ text: "Config saved successfully", ok: true });
      setForm({ model: "", api_key: "", base_url: "", temperature: 0.7, max_tokens: 2048 });
      reload();
    } catch (e) {
      setMsg({ text: e.response?.data?.detail || "Error saving config", ok: false });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this config?")) return;
    await api.delete(`/llm-configs/${id}`);
    reload();
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditForm({ model: c.model, base_url: c.base_url || "", api_key: "", temperature: c.temperature, max_tokens: c.max_tokens });
  };

  const handleUpdate = async (id) => {
    try {
      await api.put(`/llm-configs/${id}`, editForm);
      setEditingId(null);
      reload();
    } catch (e) {
      alert(e.response?.data?.detail || "Error updating config");
    }
  };

  const providers = ["groq", "openai", "anthropic", "gemini", "ollama"];

  return (
    <div className="animate-up" style={s.container}>
      <div style={s.header}>
        <div style={s.breadcrumb}>LLM Engine Settings / <span style={s.activeCrumb}>Configuration</span></div>
        <div style={s.headerRow}>
          <div>
            <h1 style={s.title}>Engine Configuration</h1>
            <p style={s.subtitle}>Configure LLM providers for your agents</p>
          </div>
          <div style={s.actions}>
            <button className="btn-primary" onClick={handleSave}>Save Changes</button>
          </div>
        </div>
      </div>

      <div style={s.layout}>
        <div style={s.main}>
          {/* Provider Selection */}
          <section style={s.section}>
            <div style={s.sectionHeader}>LLM PROVIDER</div>
            <div style={s.providerGrid}>
              {providers.map(p => (
                <div key={p} style={{ ...s.providerCard, ...(selectedProvider === p ? s.providerActive : {}) }}
                  onClick={() => setSelectedProvider(p)}>
                  <div style={s.providerIcon}>{PROVIDER_ICONS[p] || <GroqIcon />}</div>
                  <div style={s.providerName}>{p}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Model Config */}
          <section style={s.section}>
            <div style={s.sectionHeader}>MODEL CONFIGURATION</div>
            {msg.text && <div style={{ fontSize: 12, marginBottom: 12, color: msg.ok ? "var(--tertiary)" : "var(--error)" }}>{msg.text}</div>}
            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>MODEL NAME</label>
                <input type="text" placeholder="e.g. llama-3.1-8b-instant" value={form.model}
                  onChange={e => setForm({ ...form, model: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>BASE URL (OPTIONAL)</label>
                <input type="text" placeholder="Leave blank for default" value={form.base_url}
                  onChange={e => setForm({ ...form, base_url: e.target.value })} />
              </div>
            </div>
            <div style={{ ...s.field, marginTop: 16 }}>
              <label style={s.label}>API KEY</label>
              <div style={s.inputWrap}>
                <input type="password" placeholder="sk-..." value={form.api_key}
                  onChange={e => setForm({ ...form, api_key: e.target.value })} />
              </div>
              <p style={s.hint}>Stored with Fernet encryption. Never returned to frontend.</p>
            </div>
          </section>

          {/* Saved Configs */}
          {configs.length > 0 && (
            <section style={s.section}>
              <div style={s.sectionHeader}>SAVED CONFIGURATIONS</div>
              {configs.map(c => (
                <div key={c.id} style={s.configRow}>
                  {editingId === c.id ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={s.field}>
                          <label style={s.label}>MODEL</label>
                          <input value={editForm.model} onChange={e => setEditForm({ ...editForm, model: e.target.value })} />
                        </div>
                        <div style={s.field}>
                          <label style={s.label}>BASE URL</label>
                          <input value={editForm.base_url} onChange={e => setEditForm({ ...editForm, base_url: e.target.value })} placeholder="Leave blank for default" />
                        </div>
                        <div style={s.field}>
                          <label style={s.label}>NEW API KEY (leave blank to keep existing)</label>
                          <input type="password" value={editForm.api_key} onChange={e => setEditForm({ ...editForm, api_key: e.target.value })} placeholder="sk-..." />
                        </div>
                        <div style={s.field}>
                          <label style={s.label}>TEMPERATURE: {editForm.temperature}</label>
                          <input type="range" min="0" max="2" step="0.1" value={editForm.temperature} onChange={e => setEditForm({ ...editForm, temperature: parseFloat(e.target.value) })} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn-primary" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => handleUpdate(c.id)}>Save</button>
                        <button style={s.cancelBtn} onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={s.configLeft}>
                        <span style={s.configProvider}>{c.provider}</span>
                        <span style={s.configModel}>{c.model}</span>
                        {c.is_default && <span style={s.defaultTag}>DEFAULT</span>}
                      </div>
                      <div style={s.configMeta}>API Key: sk-••••••••  ·  Temp: {c.temperature}</div>
                      <button style={s.editBtn} onClick={() => startEdit(c)}>Edit</button>
                      <button style={s.deleteBtn} onClick={() => handleDelete(c.id)}>Delete</button>
                    </>
                  )}
                </div>
              ))}
            </section>
          )}

          <div style={s.contextCard}>
            <div style={s.contextIcon}>⚙️</div>
            <div>
              <div style={s.contextTitle}>Dynamic Context Compression</div>
              <div style={s.contextText}>Enabled: Automatically optimizing prompt tokens based on active window.</div>
            </div>
            <div style={s.contextStatus}>• SYSTEM SYNCED</div>
          </div>
        </div>

        <div style={s.sidebar}>
          <section style={s.sideSection}>
            <div style={s.sideHeader}>
              <div style={s.sectionHeader}>PARAMETER TUNING</div>
              <span style={s.advancedTag}>ADVANCED</span>
            </div>
            <div style={s.tuningList}>
              <div style={s.tuneItem}>
                <div style={s.tuneLabel}><span>🌡️ Temperature</span><span style={s.tuneVal}>{form.temperature}</span></div>
                <input type="range" min="0" max="2" step="0.1" value={form.temperature}
                  onChange={e => setForm({ ...form, temperature: parseFloat(e.target.value) })} style={s.range} />
                <div style={s.rangeLabels}><span>PRECISE</span><span>CREATIVE</span></div>
              </div>
              <div style={s.tuneItem}>
                <div style={s.tuneLabel}><span>Max Tokens</span><span style={s.tuneVal}>{form.max_tokens}</span></div>
                <input type="range" min="512" max="8192" step="512" value={form.max_tokens}
                  onChange={e => setForm({ ...form, max_tokens: parseInt(e.target.value) })} style={s.range} />
              </div>
            </div>
          </section>

          <section style={s.sideSection}>
            <div style={s.sectionHeader}>TOKEN & BUDGET LIMITS</div>
            <div style={s.infoList}>
              <div style={s.infoItem}>
                <div style={s.infoLabel}>Max Tokens</div>
                <div style={s.safetyText}>Controls response length. Higher = longer outputs but more cost. Recommended: 2048–4096.</div>
              </div>
              <div style={s.infoItem}>
                <div style={s.infoLabel}>Temperature</div>
                <div style={s.safetyText}>0 = deterministic, 2 = very creative. Use 0.2–0.5 for factual tasks, 0.7–1.2 for creative.</div>
              </div>
              <div style={s.infoItem}>
                <div style={s.infoLabel}>Context Windows</div>
                <div style={s.safetyText}>llama-3.1-8b: 128k · GPT-4o: 128k · Claude 3.5: 200k · Gemini 1.5: 1M tokens.</div>
              </div>
              <div style={s.infoItem}>
                <div style={s.infoLabel}>Cost Tip</div>
                <div style={s.safetyText}>Groq is free tier. Keep max_tokens low for simple tasks to reduce OpenAI/Anthropic costs.</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const s = {
  container: { paddingBottom: 40 },
  header: { marginBottom: 32 },
  breadcrumb: { fontSize: 11, fontWeight: 700, color: "var(--on-surface-variant)", marginBottom: 8, letterSpacing: "0.04em" },
  activeCrumb: { color: "var(--secondary)" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
  title: { fontSize: 28, fontWeight: 800 },
  subtitle: { fontSize: 13, color: "var(--on-surface-variant)", marginTop: 4 },
  actions: { display: "flex", gap: 12 },
  layout: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 },
  main: { display: "flex", flexDirection: "column", gap: 32 },
  section: { background: "var(--surface-bright)", borderRadius: 16, padding: 24, boxShadow: "var(--ambient-shadow)" },
  sectionHeader: { fontSize: 11, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.1em", marginBottom: 20 },
  providerGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 },
  providerCard: { background: "var(--surface-container-low)", borderRadius: 12, padding: "16px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, border: "2px solid transparent", cursor: "pointer", transition: "all 200ms ease" },
  providerActive: { background: "#fff", borderColor: "var(--secondary)", boxShadow: "0 4px 12px rgba(79,70,229,0.12)" },
  providerIcon: { width: 40, height: 40, borderRadius: 10, background: "var(--surface-container)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--on-surface)" },
  providerName: { fontSize: 11, fontWeight: 800, textAlign: "center", textTransform: "capitalize" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 10, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.08em" },
  inputWrap: { position: "relative" },
  hint: { fontSize: 11, color: "var(--on-surface-variant)", marginTop: 8 },
  configRow: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--outline)" },
  configLeft: { display: "flex", alignItems: "center", gap: 8, flex: 1 },
  configProvider: { background: "var(--secondary-container)", color: "var(--on-secondary-container)", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase" },
  configModel: { fontSize: 13, fontWeight: 600 },
  defaultTag: { background: "var(--tertiary-container)", color: "var(--on-tertiary-container)", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 },
  configMeta: { fontSize: 11, color: "var(--on-surface-variant)" },
  deleteBtn: { background: "transparent", color: "var(--error)", border: "1px solid var(--error)", borderRadius: 6, padding: "4px 10px", fontSize: 11 },
  editBtn: { background: "transparent", color: "var(--secondary)", border: "1px solid var(--secondary)", borderRadius: 6, padding: "4px 10px", fontSize: 11 },
  cancelBtn: { background: "transparent", color: "var(--on-surface-variant)", border: "1px solid var(--outline)", borderRadius: 6, padding: "6px 14px", fontSize: 12 },
  contextCard: { background: "var(--surface-container-low)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 },
  contextIcon: { fontSize: 20 },
  contextTitle: { fontSize: 13, fontWeight: 800, color: "var(--on-surface)" },
  contextText: { fontSize: 12, color: "var(--on-surface-variant)", marginTop: 2 },
  contextStatus: { marginLeft: "auto", fontSize: 10, fontWeight: 800, color: "var(--secondary)", letterSpacing: "0.05em" },
  sidebar: { display: "flex", flexDirection: "column", gap: 24 },
  sideSection: { background: "var(--surface-bright)", borderRadius: 16, padding: 24, boxShadow: "var(--ambient-shadow)" },
  sideHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  advancedTag: { fontSize: 9, fontWeight: 900, background: "var(--secondary-container)", color: "var(--on-secondary-container)", padding: "2px 6px", borderRadius: 4 },
  tuningList: { display: "flex", flexDirection: "column", gap: 24 },
  tuneItem: {},
  tuneLabel: { display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 12, fontWeight: 700 },
  tuneVal: { color: "var(--secondary)" },
  range: { width: "100%", cursor: "pointer" },
  rangeLabels: { display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 9, fontWeight: 800, color: "var(--on-surface-variant)", letterSpacing: "0.05em" },
  safetyText: { fontSize: 11, color: "var(--on-surface-variant)", lineHeight: 1.5, marginBottom: 4 },
  infoList: { display: "flex", flexDirection: "column", gap: 12 },
  infoItem: {},
  infoLabel: { fontSize: 11, fontWeight: 800, color: "var(--on-surface)", marginBottom: 2 },
  checkList: { display: "flex", flexDirection: "column", gap: 8 },
  checkItem: { fontSize: 11, fontWeight: 700, color: "var(--on-tertiary-container)" },
};
