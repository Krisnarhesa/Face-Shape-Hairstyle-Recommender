const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("captureBtn");
const resultSection = document.getElementById("resultSection");
const analyzeBtn = document.getElementById("analyzeBtn");
const hairGrid = document.getElementById("hairGrid");
const loadMoreContainer = document.getElementById("loadMoreContainer");

let imageBlob = null;
let stream = null;

let currentRecommendations = [];
let itemsShown = 0;
const ITEMS_PER_PAGE = 10;

const hairstyleImages = {
  //Round Face
  "Shaggy with thin bangs":
    "https://glints.com/id/lowongan/wp-content/uploads/2024/02/Shaggy-Waspy-Bangs.jpeg",
  "Wavy bob":
    "https://glints.com/id/lowongan/wp-content/uploads/2024/02/Wavy-bob.jpeg",
  "Natural layer":
    "https://glints.com/id/lowongan/wp-content/uploads/2024/02/Natural-Layer.jpeg",
  "Korean Pixie Cut":
    "https://glints.com/id/lowongan/wp-content/uploads/2024/02/Korean-Pixie-Cut.jpeg",
  "Layered mid-length":
    "https://glints.com/id/lowongan/wp-content/uploads/2024/02/Layered-Mid-Length.jpeg",
  "Layered bob with curtain bangs":
    "https://glints.com/id/lowongan/wp-content/uploads/2024/02/Layered-Bob-Curtain-Bangs.jpeg",
  "Shaggy layered bob with bangs":
    "https://sp-ao.shortpixel.ai/client/to_webp,q_glossy,ret_img,w_682/https://glints.com/id/lowongan/wp-content/uploads/2024/02/Shaggy-Medium-Layered-Bob-1.jpeg",
  "Flowing long layers with bangs":
    "https://sp-ao.shortpixel.ai/client/to_webp,q_glossy,ret_img,w_768/https://glints.com/id/lowongan/wp-content/uploads/2024/02/Flowing-Long-Layers.jpeg",
  "Sleek blunt bob with curtain bangs":
    "https://sp-ao.shortpixel.ai/client/to_webp,q_glossy,ret_img,w_518/https://glints.com/id/lowongan/wp-content/uploads/2024/02/Sleek-Blunt-Bob.jpeg",
  "Slimming medium tousled":
    "https://sp-ao.shortpixel.ai/client/to_webp,q_glossy,ret_img,w_768/https://glints.com/id/lowongan/wp-content/uploads/2024/02/medium-touseld-glints-768x960.webp",
  "Crinkled Lob":
    "https://www.byrdie.com/thmb/VDjjf0PYth8oETdioBClsoumqfg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1825778418-4e397ec9d9ac40619d44b3689d155aad.jpg",
  "Old Hollywood Waves":
    "https://www.byrdie.com/thmb/h6UOMJL0YVArA4TjoRv6iF7G75c=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1986325567-22f6cc3cfd3449bdab813b560ebdf1bc.jpg",
  "Textured Lob With Feathery Fringe":
    "https://www.byrdie.com/thmb/ASUKrDUcJSP0qxQ4Xt5439Ni7MU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1469834517-2eaf2ef3113b487796a26c109a01b0b2.jpg",
  "Long Blunt Waves":
    "https://www.byrdie.com/thmb/A0zbV_Ij1blICqAD0d4W8YEJVZo=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/ScreenShot2023-05-21at10.07.23AM-8d508ab819ef4d4fa0534b703dac6d4d.png",
  "Sleek Lob":
    "https://www.byrdie.com/thmb/Nf7-scmtD1-ZCsiODJ3Ozy7Xwz0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1535871754-ba4a904d94ed496e9d497398f2c3f155.jpg",
  "Smooth, Barely-There Waves":
    "https://www.byrdie.com/thmb/gOCumfb1ISvg_WVQiVmLsWazl08=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/ScreenShot2023-05-21at10.15.47AM-df11b10cfc5246cda61a4086bf3e8946.png",
  "Long, Wavy Layers With Boosted Side Bangs":
    "https://www.byrdie.com/thmb/DWkIh4zPqAlO-kiLMf8Jb1A7U9w=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/ChrissyTeigen.MichaelBuckner-56aa19645f9b58b7d000d642.jpg",
  "The Ultimate Blowout":
    "https://www.byrdie.com/thmb/W4QrjFTBeKbXJvc15REQaNxwJQ8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-2037036951-f0b153529cd14794b451934ad4f476ef.jpg",
  "Close Crop":
    "https://www.byrdie.com/thmb/uB8vOahgnhgwq3eVR3fU89Pv9Wk=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/cdn.cliqueinc.com__cache__posts__172637__from-taylor-to-lupita-7-red-lipsticks-celebrities-swear-by-1573876-1448419593.700x0c-9c939a79be074446b1836564945f1349.jpg",
  "Glam Mermaid Waves":
    "https://www.byrdie.com/thmb/8fLqoxLA5LbUDI8cfydHVT95Vj8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1423250782-c9078611769c4e8f9ea23f634a556eb3.jpg",
  "Rounded Bob With Deep Side Part":
    "https://www.byrdie.com/thmb/E4TpRI7ZphrwEjtne4rt7jN555g=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1913168628-81eb8ed406024882872b1f1c28bbf4b6.jpg",
  "Retro Bob With Deep Side Part":
    "https://www.byrdie.com/thmb/F3d_n7BXlTqOZVmSrL52Aqs-AVk=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-2036450811-ce83bea2c7604afa9a34c3569550d352.jpg",
  "Piecey Pixie":
    "https://www.byrdie.com/thmb/L6qEsN0Is5fo_BhuJJjVQl2okmY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-2041474722-d056e706aabe4845b146188a46325ffc.jpg",
  "Bouncy Lob":
    "https://www.byrdie.com/thmb/2KU6-td0LtDvsC_6HESDLmqg-_s=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1858566187-fb8a6f2ac2654046889d5a3f67f54323.jpg",
  "Ballerina Bun With Curtain Bangs":
    "https://www.byrdie.com/thmb/43l2YR79ud6RQJ67VYR6nehCbLE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1486938525-74074cdb16704ab8b706c755bc104f24.jpg",
  "Undone Messy Bun":
    "https://www.byrdie.com/thmb/ciL2Z1lWK1alZwZSP_WYaSfhY0Q=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1426852375-71e25ec2948543b6a917f363bfd3269d.jpg",
  "Curtain Bangs":
    "https://www.byrdie.com/thmb/IFJscFPXXTw7dfK79J8pc2gmRaQ=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/cdn.cliqueinc.com__cache__posts__img__uploads__current__images__0__153__659__main.original.700x0c-bf964d72157a45f69a17d0bd5ef0f80d.jpg",
  "Straight Tresses":
    "https://www.byrdie.com/thmb/dz94CTs3vOh-2u_7CeQCGOFvYY4=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/mila-kunis-long-hair-56a083f55f9b58eba4b131eb.jpg",
  "Loose Updo":
    "https://www.byrdie.com/thmb/k1KNwbVCRdzvMCDSTt9BMUkiZM8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Emma-Stone-Cannes-Makeup-56a93f655f9b58b7d0f9a0dd.jpg",
  "Center Parted Tousled Lob":
    "https://www.byrdie.com/thmb/xtmSN7nFBylAEqeginiE5iWuT8E=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/gabi-56a089673df78cafdaa28552.jpg",
  "Asymmetric Bob":
    "https://www.byrdie.com/thmb/_tcUhzmYc19mfb1f7VGGUndoMI0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1462899364-b490470b80084bb6803506fe5aecda5d.jpg",
  "Blunt, Shoulder Length Waves":
    "https://www.byrdie.com/thmb/5MZBNiDhcjzV8L2WxthWc0dQDK8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1243657037-4220e7731e014743979b439aee568421.jpg",
  "Lived-In Beach Waves":
    "https://www.byrdie.com/thmb/WdLFKadMVk6aqkZzg6S6UyNXmXg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/cdn.cliqueinc.com__cache__posts__223876__hair-color-look-younger-223876-1494568629850-image.700x0c-1568e37b8143495497a09680c5da1925.jpg",
  "Curly Pompadour":
    "https://www.byrdie.com/thmb/eA5PJApYjM4-am-YOK0fDe0sZ0Q=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-531208996-607c40a3ac5f45ee9b974f8868428b13.jpg",
  "Boho-Chic Waves":
    "https://www.byrdie.com/thmb/nPC2xS76woHpViIa7Ficuhdq4X4=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1205184123-5678355fba20495aa8a95bfe04f1ce6b.jpg",
  "Half-Up, Half-Down":
    "https://www.byrdie.com/thmb/Md0JgP7hYPLGea0rFAI0q6ZUyiM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1062373588-61f915bc080947fdbc0093dffc55bee9.jpg",
  "Textured Bob With Center Part":
    "https://www.byrdie.com/thmb/CI-rtuqqrmK_pmUtRhYciT9inL8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1149571361-f37f5fe6230d442698bdf0441d7e93a8.jpeg",
  "Natural Curls":
    "https://www.byrdie.com/thmb/SAnmz_ROvYj1oKRAGWPbS4jDsp0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-106850568-f5dfab86c4e445b487914f71daf563cf.jpg",
  "Pixie With Long Bangs":
    "https://www.byrdie.com/thmb/mAiXRwpz6Vm7Pbpg03VOemWMdWw=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-120612475-db444a60565f4904abfb224c158f09a4.jpg",
  "Lob With Razored Ends":
    "https://www.byrdie.com/thmb/x9hxHv89dtvjF5lH6IdW7l0oGHI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-461428879-17d0c361540a445abf883dead30d54d5.jpg",
  "Curly Updo":
    "https://www.byrdie.com/thmb/cej1NTKHcQfiEnG9fB2j6X9Hzbs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-950093380-fd2fe05a7e4643e3b7959993379988fb.jpg",
  "Split Half-Up, Half-Down":
    "https://www.byrdie.com/thmb/8-RGXrkbfPB5xOdWGuloRDxqytE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1397963914-07cfbcfaad7b4dbc8505c30fdd213056.jpg",
  "Modern Mullet":
    "https://www.byrdie.com/thmb/x_8su21snRtFtsk7mE5Hzr9zvdw=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1204772657-e7490bdd7d8043d2b2035c2265f87bc7.jpg",
  "Blunt Bangs":
    "https://www.byrdie.com/thmb/ya74GWNzYOyebv61Axltq81QwYM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-862566642-d0dec672c66d485fbd287381629246b5.jpeg",
  "Razored French Fringe":
    "https://www.byrdie.com/thmb/AZGEuq_YIpZKGrNafjCwjKWaCW0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/jenniekimrazoredbangs-64d93255521a4cc9b1cc20273d4d07b8.png",
  "Bouncy, Mid-Length Layers":
    "https://www.byrdie.com/thmb/OXwd6BcipKr5miXrE3tWP-9Wy_E=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1080459654-5e88abdae0aa46a68a39581ce7e84690.jpg",
  "Long Layers":
    "https://www.byrdie.com/thmb/0qY_zcAoRO35tp9J0Ks5pQmi2YE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/cdn.cliqueinc.com__cache__posts__img__uploads__current__images__0__153__652__main.original.700x0c-53d57a30402d4c168726a4c90d603563.jpg",
  "Side-Swept Waves":
    "https://www.byrdie.com/thmb/lDYj3gh1P-nZMqpkrnnKwxg9ly8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1003468052-3d0d370fa1e74ed79906979463be31e0.jpg",

  //Square Face
  "Curtain Bangs":
    "https://www.byrdie.com/thmb/5XbaIXdoS8RiRcb-EegexS7bfhM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1436909662-17207b62ea3344d692f06d8a3fbf02ad.jpg",
  "Curly and Short":
    "https://www.byrdie.com/thmb/B8UqgsNyCzcMN9VG8AsCxPiTP0Q=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-21805791431-c0df09468aea4d6abbbf7052401462f6.jpg",
  "French Bob":
    "https://www.byrdie.com/thmb/siwUBgn5r0Bi1y05MBmTbbH1DxM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1243179186-1b0037b848064a9c98441c89f57ccd6a.jpg",
  "Wavy Lob":
    "https://www.byrdie.com/thmb/_6wpo6COGqYQTJSVGH3uMPSX-No=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1061326568-f380ed88ad4945f1939c96944825a707.jpg",
  "Epic Length With Dramatic Side Part":
    "https://www.byrdie.com/thmb/gLwOL2nw7f1VVu0d_CLbwGlOgcw=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1826930323-1dcf4bac7fff46dfa6e3f0bd18b00244.jpg",
  "Italian Bob":
    "https://www.byrdie.com/thmb/CDgXqpTxdvSoxfU7Kz_zacFZNFM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/zendaya-1b1df5bb91e541f7af3f95e30ce7f5d7.jpg",
  "Curtain Layers":
    "https://www.byrdie.com/thmb/gw43ThsozPfYoD32CMu7PkXflRo=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/gwyneth-paltrow-blonde-hair-56a084233df78cafdaa25d3e.jpg",
  "Rounded Bob":
    "https://www.byrdie.com/thmb/-uYeJX1lr6yOqN7xdXKI7v83_fk=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/kiera-knightley-long-bob-57bef22b3df78cc16ef95c5c.jpg",
  "Tousled Bob":
    "https://www.byrdie.com/thmb/hzDiyrY0kte-KcS3fl2kPWzkbqc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-927372604-f067b08d3d74495cb2a4c27dab57d1b8.jpg",
  "Feathered Shoulder-Length Cut":
    "https://www.byrdie.com/thmb/0MGVshICaXDB7Ji1GCO_-ImPDFg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/mandy-moore-square-face-shape-56a084655f9b58eba4b13519.jpg",
  "Razor-Cut Lob":
    "https://www.byrdie.com/thmb/C0VjiNSBocH9u0yFyJmcE6RKdVI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-473204038-21d5c0a155504c3098c1e1dfc943d53a.jpg",
  "Textured Layers":
    "https://www.byrdie.com/thmb/e-K4JmPN2VhNfPNLK5biS9ichXE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/kate-moss-shoulder-length-56a084075f9b58eba4b13282.jpg",
  "Long Length and Side-Swept Bangs":
    "https://www.byrdie.com/thmb/HrO81vnqsImg0kTtZIZsVdvstBA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/olivia-wilde-square-face-57bef2263df78cc16ef95400.jpg",
  "Long, Voluminous Layers":
    "https://www.byrdie.com/thmb/Lukk8YyL5AfT3-l82-7hR9Bcg1U=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-925041862-5764e19d37fe44668447dce4d58ba084.jpg",
  "Mid-Length Cut With Bangs":
    "https://www.byrdie.com/thmb/GimDuWj4GClohNRoUyTbToTrByA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-489883832-4175a4081d974e86969b5f8c21d2539b.jpg",
  "Spiraled Bob":
    "https://www.byrdie.com/thmb/5BhkcomrWrPcNYr_sqb-j5W79sE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1458818451-555bdf3bf3b04f32959b314b17b90aaa.jpg",
  "Choppy Pixie":
    "https://www.byrdie.com/thmb/A1fwMSXpygDbh2bGWPGlQuxPA4c=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/cdn.cliqueinc.com__cache__posts__246638__pixie-cut-246638-1515774546703-main.700x0c-8ee19fc84da3405bb519ab8a14e8f604.jpg",
  "Baby Bangs":
    "https://www.byrdie.com/thmb/rv3R6eWypitg59vTLJ21nuqcaOA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-21825693101-1ae2a1af39b54c1fa54d3d19d66f0b6b.jpg",
  "Face-Framing Angles":
    "https://www.byrdie.com/thmb/-bzYRKTdS0M2u19OAZTh5oO3SeY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1145359134-9daecba80389418bb73ddfe10768d807.jpeg",
  "Silky and Sideswept":
    "https://www.byrdie.com/thmb/7-JorITMKS3HzMpTrfp1XE91_dQ=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-21879259471-76b61046a71f4e9dbefdf3650133da8f.jpg",
  "A Weightless Cut":
    "https://www.byrdie.com/thmb/MI7uWU7RWvnVF67gNu8FN4Su0hs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/priyankachopra-32361239ee314c78b8be555c71dce36f.jpg",
  "Sleek, Mono-Length Cut":
    "https://www.byrdie.com/thmb/5EYTiB5ZA3wfHpuQ_1L-vCsKjIc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/JenniferLopez.JasonMerritt-56aa18895f9b58b7d000d41d.jpg",
  "Curly Layers":
    "https://www.byrdie.com/thmb/V3JjArlCnsdO_ipHY3zkA26N75s=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1187768582-da6cba8765ee44909a92a83fe3cacf7f.jpg",
  "Modern Shag":
    "https://www.byrdie.com/thmb/p2EKpgBpQHuKOkAS1FLtnLXOwCg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-488867436-1dad3c3dd2fe4a028206265fc6bf6f54.jpg",
  "Sideswept Blowout":
    "https://www.byrdie.com/thmb/rBLr76bs0sn9t4bVvnQC3AFrycY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-21483229071-10130064335442b3aa3617256e5bd64f.jpg",
  "Curly Shag":
    "https://www.byrdie.com/thmb/VuA5ZEXKRHZqwdSm0fODRbwB3JQ=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-8312177341-2f1c0809ff6840b6b64a3bdfe4a98ea4.jpg",
  "Soft Structure":
    "https://www.byrdie.com/thmb/mL8CScxybR8I42AkpOhJF9E-NUU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-495219587-757b7146adb54f51a99256456237c6ee.jpg",
  "Cropped Curls":
    "https://www.byrdie.com/thmb/GZwdr0caBU1eoPa6Gnky5QBvy9I=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1399439435-e69a815d368449f288cf9addba6ed7aa.jpg",
  "Timeless Pageboy":
    "https://www.byrdie.com/thmb/kgo2GqUIJAK-VBysyxCqyWMCBso=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-631189080-942a8ac7f5f94fffb5da2501acea39e1.jpg",
  "Braided Updo":
    "https://www.byrdie.com/thmb/jksupGV4w0BF2HLjDcRBxuaN268=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1590759022-30d88f831fae4f88bfda3a0e30837b0d.jpg",

  //Heart Face
  "Close Crop With Baby Bangs":
    "https://www.byrdie.com/thmb/TQWECYxeO-ApQpHVkfa725zoU_c=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1149417772-1320af2342e8474ea612778b0ef6e002.jpg",
  "Short and Choppy Pixie":
    "https://www.byrdie.com/thmb/NpcW_D5GnAHXozaVG4UfBzJjrKM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1078772590-1510ff298b704382b307ebef1f922cb9.jpg",
  "Curly Pixie":
    "https://www.byrdie.com/thmb/ZbG31GTDWf7Ace8GU9-OyO3Mi0w=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Untitleddesign2-c6138bbecc3f43379a8e79e4db8ec279.png",
  "Long and Side-Parted Pixie":
    "https://www.byrdie.com/thmb/C0TH25foTMvk_0jAfC7-uWM4BJQ=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/cdn.cliqueinc.com__cache__posts__227220__haircuts-for-heart-shaped-faces-227220-1497909993525-main.700x0c-9144eadb59ef4b6e82ad44126f53d2d4.jpg",
  "Sculpted Pixie":
    "https://www.byrdie.com/thmb/1whaOl0xdcYYl_4IcNp57-KFtx4=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-926045364-01ef852ebc2c47f4a1267785e26a9a8d.jpg",
  "Slicked-Back Bun":
    "https://www.byrdie.com/thmb/2odprXh_1zqE_F9l-2DOzXu7zKQ=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/florence-pugh-clapped-back-at--vulgar--critics-of-her-see-through-valentino-dress-1422bbe268dc4800a9a37ea3dc44492e",
  "Waved Bixie":
    "https://www.byrdie.com/thmb/-Vm4A0rUsC3Z8xUs-RWAuGMlM7I=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1473260476-a4d03779932d49d5bbf9e88542a1692e.jpg",
  "Bent Midi Bob":
    "https://www.byrdie.com/thmb/Dg_IqTDHmYslkD6XFDZNZ62MbuE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/selena-f4e74320e9654c1ea786b8280d61037d.png",
  "Retro Glam":
    "https://www.byrdie.com/thmb/4U9Tgo7LvSE3uYfl1jjOsYFpJSo=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-621543512-76c0f47cf201494d8ed3c1ba2f045f9e.jpg",
  "Tousled Tendril Half-Updo":
    "https://www.byrdie.com/thmb/lZ-uzNcdZijjGEbzZ0nSOLCkGiU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/gemmachan-5a52e4c722174875bb557582a5f10318.png",
  "Cropped and Stacked":
    "https://www.byrdie.com/thmb/Nrk4uhyre93-diGBavOftkTP3q8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-915541712-59b5b95a2a0f480da74b785589c22d48.jpg",
  "Flared Bob":
    "https://www.byrdie.com/thmb/pFsPAFaNI6BS7IkgJFSuiPJXCgU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/cdn.cliqueinc.com__cache__posts__246460__bob-haircuts-for-fine-hair-246460-1515717426182-main.700x0c-6e65b9ada076456cb7912adac893357f.jpg",
  "Curly Lob With Bangs":
    "https://www.byrdie.com/thmb/q2vI0GNiAqugnbkniFaQNA4wMD0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-462788686-9dddf482b47341afb87bf7c9c131866f.jpg",
  "Collarbone-Length with Layers":
    "https://www.byrdie.com/thmb/vRYxleTE60Jhy4DSYNudZpFzCP8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-887966834-ef9cf6490e914895a7ecad6acfe2f871.jpg",
  "Wavy Shoulder Length with Side Bangs":
    "https://www.byrdie.com/thmb/oDOj9Ie6t5K1QEna6TrCzxC9R2A=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/wavyhair-c0daf1b9a9684813affda1b8bcf5046a.png",
  "Wavy Lob with a Center Part":
    "https://www.byrdie.com/thmb/DeyVDL9uraHWg8EcCnVzVrYMOGE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Untitleddesign5-363e5b7a561f484989416b0135ee5d5a.png",
  "Fluffy Curls":
    "https://www.byrdie.com/thmb/eIblquFkVlTD-lUTBFzksKPcXgU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/lattoscurls-880925e7030e48adb2593cf82f870cf5.png",
  "Pulled Back with a Deep Side Part":
    "https://www.byrdie.com/thmb/xXdqNxt0yuvtRgFV3nWKcz9qJhs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/tuckedback-f09723efec084784ba79de3a356ee9b4.png",
  "Flipped-Out Lob With a Center Part":
    "https://www.byrdie.com/thmb/DrSNE6f2u1JIUXSKmOoMk1sH_Dk=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1160312242-4d7dfe2193a149af802d59bbe67b413a.jpg",
  "Flipped-In Lob":
    "https://www.byrdie.com/thmb/Mk_BkX0ZPTECVKLclXDSs-Pgtoc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/heartshapedface-zoe-832851a8778043f182aa8924d45a7b2a.jpg",
  "Wavy Lob With a Side Part":
    "https://www.byrdie.com/thmb/kLf9TxXd8_6wUigKc2CFTnb1j9c=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-495383148-6c3a0b89a51645a18fd50e8c4e5b6d42.jpg",
  "Long Layers and Beach Waves":
    "https://www.byrdie.com/thmb/5QH0ekr5hZC62qRpFaIWlJnTaSw=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1181134861-3a31dafb9e93482da873f1d1eaff610f.jpg",
  "Tight Topknot":
    "https://www.byrdie.com/thmb/l4In7sBl9Ik5rS8uApovsSCLF14=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/heartshapedface-gabrielle-6ae13acafaee4afb9b7f2f2f85b2efda.jpg",
  "Shaved Pixie Cut":
    "https://www.byrdie.com/thmb/15mPdKnJFl_hxXtbdHhMx15MqvQ=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/scarlet-6edaf983257d4880893cf79865d8842f.png",
  "Long Wavy Layers With a Side Part":
    "https://www.byrdie.com/thmb/ih43d4F1pR3662ZZYzAJeiwbMAs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-850388932-87eeb6c0050544e6a412aad8aecb80b3.jpg",
  "Loose Waves With Long Layers and a Center Part":
    "https://www.byrdie.com/thmb/U3bxGUz_bKYN57gBFARy4P9CJoM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Untitleddesign1-8076756073a24c36b3c158eaaf998560.png",
  "Natural Curls":
    "https://www.byrdie.com/thmb/T10Gg9ej_tWsJ8YjeaXszEcoKko=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/heartshapedface-tika-f86129924c3844a4befcc34bfe99dff9.jpg",
  "Wavy Layers With a Deep Side Part":
    "https://www.byrdie.com/thmb/T10Gg9ej_tWsJ8YjeaXszEcoKko=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/heartshapedface-tika-f86129924c3844a4befcc34bfe99dff9.jpg",
  "Face-Framing Highlights and Long Layers":
    "https://www.byrdie.com/thmb/CvkQlhNKf1H1UI30FISRjO4jrzE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1202360064-90c3a2d471ea4d1ea59130bd3123d128.jpg",
  "Long Feathered Layers":
    "https://www.byrdie.com/thmb/Z0gFxK9YJkAt6Rm0vSYHhRd71QM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/heartshapedface-keke-aba190574fc446028d54b689e2303b5b.jpg",
  "Long and Textured Bangs":
    "https://www.byrdie.com/thmb/_eTxrbrDiNvkq8-MU_S36oH02DA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-488017632-7e9e486ce8204506ad03663382bfe870.jpg",
  "Blunt Bangs":
    "https://www.byrdie.com/thmb/PqpxRC5gAyKSYfC8QiljvWPHxS8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Untitleddesign4-cbeaa1a413d34425b1ee87cc728661a4.png",
  "Long and Wispy Bangs":
    "https://www.byrdie.com/thmb/RAd9o0Hn5EWwKX2ObTOzss-kpd8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-628126670-a2e6211aa45d4b76b4e1adcb4118894e.jpg",
  "Curtain Bangs":
    "https://www.byrdie.com/thmb/NeyBZnlPKdfigBKb2lxo2YEnSGM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Untitleddesign-1164b5f7f8c146d3b269ed3d1a69ba36.png",
  "Side-Swept Bangs":
    "https://www.byrdie.com/thmb/gTMkgQ-iZfDp55Si7dlyHkr0zRU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-632658780-7228e120ad4043fba4b88c4799c142ab.jpg",

  //Oval Face
  "Textured Pixie":
    "https://www.byrdie.com/thmb/ByDSz_Yv7Jrxjfp7x7M3_AArXFs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-163187787-fe16eea88dfe4ce7aae65960d6ad1b37.jpg",
  "Curly Side Part":
    "https://www.byrdie.com/thmb/9eExT2FlbBcyCWXant0JDUattbg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/haircutsforovalfaces-56c4a59453714b538c3c01a43b135761.jpg",
  "Butterfly Haircut":
    "https://www.byrdie.com/thmb/uGgpsaZhqshdZicoO8Rphv6DKmo=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/ovalshapehaircut-d4d698b6f5734d59aa7f2ca113732607.jpg",
  "Soft Blowout":
    "https://www.byrdie.com/thmb/Gy5jEDpIfMgKWGGkXw2RLCoNh2Y=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/CindyCrawford1-3d16c32679b44f53a67e6dec805c4aaa.png",
  "Mermaid Waves":
    "https://www.byrdie.com/thmb/otoiBxcXiXHDNNxU_byWQMhnqs4=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/SnapInsta.to_455024517_18455686039011668_452815755118250961_n-b0e4384b337e41bc86f12616befca4a5.jpg",
  "Side-Swept Pixie":
    "https://www.byrdie.com/thmb/LZtNoZBySQt9PE3_-7vrNsYmTwA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-871521668-2c1cfa79c4e04b3498c5194d4786e995.jpg",
  "Grown-Out Pixie":
    "https://www.byrdie.com/thmb/5vN_auDSvhkzlZWi4tSAHL4xPFM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/jenna-elfman-56a087843df78cafdaa276f0.jpg",
  "Polished Pixie":
    "https://www.byrdie.com/thmb/0i_lgmrBupF-2y83nFpLdHfxy8Q=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-106048814-70f5e8c44c4244a3a914f4a2c0311771.jpg",
  "Structured Undercut":
    "https://www.byrdie.com/thmb/vu6rPsYUOM5mq4A7ieBVMYTGYyE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-645640286-210ab59f120a4846a7199a4007e86608.jpg",
  "Natural Pompadour":
    "https://www.byrdie.com/thmb/HxntrnRd2uKyJYHIqeIa839GW50=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1058978346-f3a50036737d4213a60ffaad6e19b6b6.jpg",
  "Voluminous Pompadour":
    "https://www.byrdie.com/thmb/sJ1W6QFYYUjdTTIVuZVMozcsRDY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-908630526-5c27f4234004407bb46fb2abf3215f78.jpg",
  "Chin-Length Bob":
    "https://www.byrdie.com/thmb/_0bnyBG6cNMP1tLJ9SIVj8udGiE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-845450722-0c995ffa8c4f412387073135fedd45fe.jpg",
  "Side-Parted Lob":
    "https://www.byrdie.com/thmb/7GDerucQdxq1hU-kFsiQlHkqAFk=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-687381336-59f055720d214f16abccfe147f7870e2.jpg",
  "Textured Bob With Heavy Bangs":
    "https://www.byrdie.com/thmb/ZHDHPyO6QC6BUWlRE7iwziKI-3U=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-679849382-65d76134d2674b4a95361045e6c27147.jpg",
  "Wet-Look Bob":
    "https://www.byrdie.com/thmb/Ip2rCwk9Tds9FFQR882Yo31yfK8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1344973376-7b4bd4da8dc14ec89c16dde525da3e32.jpg",
  "Shoulder-Length Shag":
    "https://www.byrdie.com/thmb/6afuPHJcTATAQvWCr7YcDkPlQxs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-13440792621-5a20db2232834e619b2b36da115a413f.jpg",
  "Angled Lob":
    "https://www.byrdie.com/thmb/CrTgPnAyUo_tR8lF9hsZM-f1xv0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1191517730-bb984427cf6a4e528bd8f5cd0ed06479.jpg",
  "Blunt French Bob":
    "https://www.byrdie.com/thmb/icIEu8v_HGQyvtizNPGrWEafXj0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1202001012-9d77c2f0b80e445b8c80329e0b286747.jpg",
  "Layered Bob":
    "https://www.byrdie.com/thmb/bdasoaxuQ38lCsssG33gdpVegvM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-599028680-75261038ae544bfe96e3c5313ac1e1cf.jpg",
  "Heart-Shaped Fro":
    "https://www.byrdie.com/thmb/ILkoeDH1AYg6ErUH-eKiVy7bBS8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1458818451-3b5dd4ab74144ff4b89d1f53ce7ef5e4.jpg",
  "Asymmetrical Bob":
    "https://www.byrdie.com/thmb/Q0FuaB59BdpSuB_hvvvXeOtcFac=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-461436004-98dec3a7c1d14e73b5587cc22a99f26a.jpg",
  "Blunt Bob":
    "https://www.byrdie.com/thmb/luAZI1Pxmwav3FKUb0yrVxs9r_8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-512137526-9a2e9d6703144f31a7c8dabec8925b6c.jpg",
  "'80s Lob With Bangs":
    "https://www.byrdie.com/thmb/UouLUApEBskaLanNWgl_-qb1PMs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-692753762-7fd427160fc24308a75de1e42e863610.jpg",
  "Modern Shag":
    "https://www.byrdie.com/thmb/Uh1Y1ZicdK26vtdbTaZBakjUaR4=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/julianne-hough-blonde-hair-56a0849f3df78cafdaa2612e.jpg",
  "Soft Curls":
    "https://www.byrdie.com/thmb/RfvO55rVj4TtXFu0Cwre-euGyIs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-620943126-5635cd9cdae84f9f93ac753e653dede9.jpg",
  "Modern Mullet":
    "https://www.byrdie.com/thmb/kwiSR0IpPiBqzXAFgcCKFBIZjeE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1204754208-d4fb5cf5f87149b6b4bf44e050a414ad.jpg",
  "Shoulder-Length Loose Waves":
    "https://www.byrdie.com/thmb/Gbr0XvkBlmN0ofTS7Jst98dYMQ8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/gabunion-6949c9e7be5b47caa876b1dda21f954b.jpg",
  "Half-Up, Half-Down Lob":
    "https://www.byrdie.com/thmb/OWRnRSiB42a-fN7NxvXvMg1aYGo=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1048393762-a7485cfef2cf4207902bf38bbdb2d39f.jpg",
  "Curtain Bangs":
    "https://www.byrdie.com/thmb/ZvvyyeqANJjq5YY0soYFdaIXCv0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-854243342-090f367edd944ee597ec519f9d72d8e6.jpg",
  "Retro Waves":
    "https://www.byrdie.com/thmb/1dYuB5-EZMSvoW0AESIQibJKW7A=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-530272470-b3ef4914095942ed9b66c8a095f0a08b.jpg",
  "Wavy Shag With Bangs":
    "https://www.byrdie.com/thmb/LZyMCX3q3C1E_hHufjIhI2kiVow=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1082113886-d6beb3ddd483407d9db3fcb749b5a266.jpg",
  "Shoulder-Length Soft Curls":
    "https://www.byrdie.com/thmb/sqwrlvef4-79qWEljpxgyssOaXk=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-467766134-ac3aee082da74dbcbd13218e8fcacb2e.jpg",
  "Deep Side Part":
    "https://www.byrdie.com/thmb/cwx__tVSk5wrflwK5M-JA3CXx5M=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-654234338-e3543e7a853a42ce89bd8ae9b166a9b5.jpg",
  "Face-Framing Layers":
    "https://www.byrdie.com/thmb/hKi1XFeUIQLEkkHy1e0XtDZmylk=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1180508514-ecc52f930b0d48aeb59e38b2e04316d0.jpg",
  "Long and Wavy":
    "https://www.byrdie.com/thmb/esabaMuz6Zq6vf6DueJ7Q7qrFMg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/brooklyn-decker-brown-hair-56a0849e5f9b58eba4b136f3.jpg",
  "Side-Swept Bangs":
    "https://www.byrdie.com/thmb/ofxs07V_yIrc_rRXZufLhMN01eo=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-108053427-05d60b549508490ebb34d19c200b9e00.jpg",
  "Beachy Face-Framing Layers":
    "https://www.byrdie.com/thmb/zVcoRPYe_C223ij-7CbiY38hR04=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-665105946-9ac0500b3712486c82ce979bbface24c.jpg",
  "Long and Sleek":
    "https://www.byrdie.com/thmb/5NiJEmIQg3XjyEtBdS0uaJ0TIqM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/jennifer-hudson-blunt-bangs-56a084963df78cafdaa260d0.jpg",
  "Long, Tight Waves With Center Part":
    "https://www.byrdie.com/thmb/HpMDpvEYj3WC3pMXOrZ3xGPZvVU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-849738722-413be1c491d14f0cb93d4dcf98bcd78a.jpg",
  "Side-Parted Retro Waves":
    "https://www.byrdie.com/thmb/ijJm3NjLmSY_Qq22lKlUQ16Jv5I=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1200422493-2285ffdb5e124bd288a81bef20194eba.jpg",
  "Half-Up, Half-Down Topknot":
    "https://www.byrdie.com/thmb/XpKkBfcKKibo1iLogxqApE8FYfI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-893230718-faa6e6ffef86447f800997756cc9b30b.jpg",
  "Air-Dried Waves With Volume":
    "https://www.byrdie.com/thmb/WvTl2Yv_BGr-OVSAQFlzJQ68bs4=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1048514370-fc741eb1013f480a89e1968df04b6ae6.jpg",
  "Long Single Braid":
    "https://www.byrdie.com/thmb/GjQDiLxhVitlWJ50ya32AJu5l8o=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1204503385-6994aea10d20416facc7129d1d0cb995.jpg",
  "Updo With Wavy Tendrils":
    "https://www.byrdie.com/thmb/tm6VEVpMkZgQCB_4WB481_JVX2o=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Blake-Lively-Getty-3b19a57727a7483091ecac16fd0fb01c.jpg",
  "Long Double Braids":
    "https://www.byrdie.com/thmb/4wY1Q3U6xUSVTvVuB70ZnQQ19XA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1134364447-645883ea9bc14c408f891a1b03b3bfc9.jpg",
  "Updo with Cascading Curtain Bangs":
    "https://www.byrdie.com/thmb/agFK-fx32_kNXA-shi6NMEuEdZE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1204550155-a00f1be979a1406e94978b4f03f5b3e9.jpg",
  "Natural Half-Up, Half-Down":
    "https://www.byrdie.com/thmb/86GCa-MmEYT2dfX6fjbdXPMkBOY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-945969844-6ee686d4fde34e9ea9f38f21b56c3d6c.jpg",
  "Center-Parted Topknot":
    "https://www.byrdie.com/thmb/xMqkYtI8a9dXDNjzwG1mdnBvckk=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-686483160-a9bfce2a746a4cfc91f5f71b2a64b344.jpg",
  "Low Braid with Layers":
    "https://www.byrdie.com/thmb/E9h19O1RqagIYQX5lDVib-EyLM0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1331021346-3fc789b508cc4eafa830eed1964d60d8.jpg",
  "Full Fringe":
    "https://www.byrdie.com/thmb/my2ZhhCcose2QC2Dgt-r4IzRIWM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/dakotajohnson-7e0438fdcd06409bb44a2a079f416bec.jpg",
  "Center-Parted Curls":
    "https://www.byrdie.com/thmb/v6s5D6vrbI6x8Me4tYDfjB0ZxVQ=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/giselebundchen-1e1aa5183f00462488868318e3ea54a9.jpg",
  "Casual Toussle":
    "https://www.byrdie.com/thmb/C775XCjQrKnbZXNGeLja37Kdy30=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/jennifergarner-1e399267653d404c95294de77a5569ad.jpg",
  "Sleek and Center-Parted":
    "https://www.byrdie.com/thmb/Rd-QnqSqvhnHCN6AUtIr1TkePdU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/jenniferlopez-a7c4ce4881c847968b79cceb9b22f90d.jpg",
  "Subtle Side-Swept":
    "https://www.byrdie.com/thmb/QaBjHUYLZ52godOhTeTnTGYikNU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/lucyliu-fedac68813dd4a32864113947104a82a.jpg",
  "Slick-Back Ponytail":
    "https://www.byrdie.com/thmb/p_GgVzPtS41ffZG2sMs_fhBBwwk=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/traceeellisross-1c4e2057f77941d0b262b4850c1b34b9.jpg",
  "Runway-Ready Waves":
    "https://www.byrdie.com/thmb/FBOrsbbFHVSG0l_4wRKTPio_XjQ=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/tyrabanks1-e895c53426a14d60a9612e728d2fc15d.jpg",

  //Oblong Face
  "Curly Shag":
    "https://www.byrdie.com/thmb/j-9hYOOSJg5FXhy-W2rRfFVvgHw=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1474206780-c9aa5b665ca44774beb22fab841aab0b.jpg",
  "Center Parted Ponytail":
    "https://www.byrdie.com/thmb/DaxIWJdLMhYsPRjZXdT1dFs1GtU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/ciara-baa7c16b661148e7bd386dd1a5652a89.png",
  "Piecy Pixie":
    "https://www.byrdie.com/thmb/q1PHmnpby6kHkvkIHsVLDA-_7w8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1340264979-5aa98bf690e24d24a926ea2b16d3b719.jpg",
  "Curtain Bangs":
    "https://www.byrdie.com/thmb/xdcQHg38eXSSrNGQ-u27r4rfWbc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/olga-a978e08082e94b70b3ffb44e6f31b7be.png",
  "Blunt Bangs":
    "https://www.byrdie.com/thmb/vwSrx2arhcwSIBN4w_OzcrAwjdY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-2021275297-a215be0b86e14097ac92eedaa8b565b6.jpg",
  "Curly Ponytail":
    "https://www.byrdie.com/thmb/My5F6pD2ZWc_F85Ys3L0gOigBnI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-915921684-37e5ea9c550f4d9f9284b3cd0921b809.jpg",
  "Perfectly Messy Bun":
    "https://www.byrdie.com/thmb/e3okYQefbV-MfqMUi1_0vk6qrVs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/rihanna-75960dd8891c40c38c2f3688525161f6.png",
  "Angled Bob":
    "https://www.byrdie.com/thmb/cV2O5TcXgSTMNaGMeMtp9ANnnWI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/iman-656c6187b1c7472faf46c2d78328ded8.png",
  "French Bob":
    "https://www.byrdie.com/thmb/DFDg9F9ykkw5_n6VFlxJHlR3h6w=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1985217394-953b777435cd474699b9623799514f4b.jpg",
  "Sculpted Curls":
    "https://www.byrdie.com/thmb/s6lN7S4YC0RxU3lhIsVHPRXEvFA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/sandraoh-b7b105ebeb924a998ee20a091ca63c86.png",
  "Teased Curls":
    "https://www.byrdie.com/thmb/41f5Nrq5XB87pQRf6L7nQKj8KtQ=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/tyra-7394306ba7f9498299a771b691f84346.png",
  "Half-Up, Half-Down":
    "https://www.byrdie.com/thmb/fHGlSQmWeYBcDFEBYp_jBKlhIFk=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/kerry-1544038b4c3a4563bf4dcfa14aeea54e.png",
  "Long Layers With Short Angles":
    "https://www.byrdie.com/thmb/cxjo3MtG8pOI1Wol3KIxZq1Gywc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/kimkardashian-ef9e8cdac45446e697c742be89a4dc92.png",
  "Blunt Bob With Bangs":
    "https://www.byrdie.com/thmb/Ylgb1E0XkP0QXE3_qnKs-CkjuoM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/taylor-a6f1d5dd711440c0bb2f9f913a18d690.png",
  "Middle-Parted Waves":
    "https://www.byrdie.com/thmb/JLbm2iCbjG9IrPjoWNrdsygu3gw=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/lea-90e7e1651c4848c9ace15812a8e9f41e.png",
  "Bouncy Bob":
    "https://www.byrdie.com/thmb/XKBp-B3KO2ssiMMxG2r8r8KLJZg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/bella-8c6328557a784943bd2c0b6e07cd3fff.png",
  "Layered Lob":
    "https://www.byrdie.com/thmb/A6wKbdyDsZNh9BnF2NPmul45Rko=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/maggie-c8337881a1df4d10915b97851d390513.png",
  "Shoulder Length Finger Waves":
    "https://www.byrdie.com/thmb/TbJu-Z821O2HRdVQKez7Gw7MVUE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/jessica-45e25addcfe04161b512e85e0ba5d6e3.png",
  "Asymmetric Lob With Bangs":
    "https://www.byrdie.com/thmb/wDW8ODc792jn8dEPZ7N8Bnm_6qU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/gabrielleunion-785e965acb634283824d69f7df7b7570.png",
  "Long, Tousled Layers":
    "https://www.byrdie.com/thmb/6Bl7F4Z6LKTWrMMjFOZfHXMonZ0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/gisele-6d88b8eebf8543c1b83eecaf866ca636.png",
  "Bouncy Blowout":
    "https://www.byrdie.com/thmb/sywdERHf00EAnr9AY8wETD3wWmo=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-2009153740-1860b60eabca4072b50675be3bd39116.jpg",
  "Full Curls":
    "https://www.byrdie.com/thmb/faTWc4wdRz6VZQyR32II4u4NAc0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/tracee-c3771f51a1a94d03ac2ebe0b175ef17a.png",
  "Beachy Waves":
    "https://www.byrdie.com/thmb/qYRQgpuEn_Eg-rSYQ4bFbz6iuNo=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/kelly-57bab3ebe6c546fbacb11615903f4776.png",
  "Updo With Bangs":
    "https://www.byrdie.com/thmb/wGn5DK4V6ZafZQfuEyZORbVHTBs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/sandra1-b26870184942468a9550b8b735fddae9.png",
  "Weightless Waves":
    "https://www.byrdie.com/thmb/bkM92N7Bipj70-iBMp9CQUumnAs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/jessica1-474179c5ca454a05b90465a4c921b42e.png",
  "Close Cropped Pixie":
    "https://www.byrdie.com/thmb/1BZNVMGFXeJdxT1EjZn1Sd32A60=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/lupita-1e6b61e9154f4ebd9a507c3efccae6d4.png",
  "Center Parted Tousled Lob":
    "https://www.byrdie.com/thmb/vEeFQ4OUzlwKBudKe6PHYQ6qTS0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/alexachung-e757ab9787bc440cbaefae8166d4aa9a.png",
  "Long, Retro Waves":
    "https://www.byrdie.com/thmb/3Bqz4Ogs8u2UDQiaGcxt8fvctGA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/KateBeckinsale-8cc0f6fb13ac462980788cc6bb2438bc.png",
  "Pineapple Updo":
    "https://www.byrdie.com/thmb/MzZd2GylqEwxymZjvvpcoZPnpa4=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-960243708-8834da7faf3040098c1225aab02d18f2.jpg",
  "Faux Curtain Bangs":
    "https://www.byrdie.com/thmb/DFrtjqVukb4R3nAmvgUAQq0CIoc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/chloe-dbda2f2a607747e0afa35b3c18ed631c.png",
  "Modern Pageboy":
    "https://www.byrdie.com/thmb/_ANodfktdKFZs0GohcdY-wax_cs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/ashlee-20ce912ad4bd42149c16663f689a479d.png",
  "Classic Braid":
    "https://www.byrdie.com/thmb/L-v2FRJJ6UZCk6Rekq2iYi5Rueo=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/sarah1-9957608b5d914461beae4398f76856b0.png",
  "Jellyfish Cut":
    "https://www.byrdie.com/thmb/P1VJWKwdJffYkOQSvZq12EEMYzg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/joan-112044dee457475bbc61c778f8661783.png",
  "Textured Length":
    "https://www.byrdie.com/thmb/FcRO77JduXKiYxW4TZXW06Wi_tM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/blake-bba7acdcac7e41bfb825965b0b5477c4.png",
  "Center-Parted Waves":
    "https://www.byrdie.com/thmb/HMF6A2cDD-cTQoqkT9Iw4KrMc1Q=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/hilary-38bd8d0555a64526a6c53385bda4ee74.png",
};

imageInput.addEventListener("change", () => {
  stopCamera();
  const file = imageInput.files[0];
  if (!file) return;
  imageBlob = file;
  showPreview(URL.createObjectURL(file));
  analyzeBtn.classList.remove("hidden");
});

function openCamera() {
  navigator.mediaDevices.getUserMedia({ video: true }).then((s) => {
    stream = s;
    video.srcObject = stream;
    video.classList.remove("hidden");
    captureBtn.classList.remove("hidden");
    preview.innerHTML = "";
  });
}

function capturePhoto() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);
  canvas.toBlob((blob) => {
    imageBlob = blob;
    showPreview(URL.createObjectURL(blob));
    analyzeBtn.classList.remove("hidden");
  });
  stopCamera();
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  video.classList.add("hidden");
  captureBtn.classList.add("hidden");
}

function showPreview(src) {
  preview.innerHTML = `<img src="${src}" />`;
}

function smoothScrollToResult() {
  const start = window.scrollY;
  const end = resultSection.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: end, behavior: "smooth" });
}


async function analyze() {
  if (!imageBlob) return;

  analyzeBtn.innerText = "Analysing...";

  const formData = new FormData();
  formData.append("file", imageBlob);

  const res = await fetch("http://127.0.0.1:8000/predict", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  currentRecommendations = data.recommendations;
  itemsShown = 0;
  hairGrid.innerHTML = "";

  resultSection.classList.remove("hidden");
  smoothScrollToResult();

  document.getElementById("analysis").innerHTML = `
    <div style="margin-bottom:20px; text-align:left;">
      <div class="face-label">DIAGNOSIS</div>
      <div class="face-value">${data.face_shape}</div>
    </div>

    <div style="text-align:left; font-family:'Anton'; font-size:1.2rem; color:var(--p5-gray);">CONFIDENCE LEVEL</div>
    <div class="p5-progress-wrap">
      <div class="p5-progress-fill" style="width:${data.confidence}%"></div>
    </div>
    <div style="text-align:right; font-size: 2.5rem; font-family:'Anton'; color:var(--p5-red);">${data.confidence}%</div>
    
    <p style="margin-top:20px; font-weight:600; font-style:italic; border-top:2px dashed black; padding-top:10px;">
      "The shape has been revealed! We suggest these disguises to enhance your charm."
    </p>
  `;

  analyzeBtn.innerText = "Analysis!";
  loadMore();
}

function loadMore() {
  const start = itemsShown;
  const end = start + ITEMS_PER_PAGE;
  const batch = currentRecommendations.slice(start, end);

  if (batch.length === 0) return;

  const fragment = document.createDocumentFragment();

  batch.forEach((h) => {
    const div = document.createElement("div");
    div.className = "hair-item";

    const imgSrc = hairstyleImages[h];

    div.innerHTML = `
      <img src="${imgSrc}" loading="lazy" alt="${h}">
      <div class="hair-name">${h}</div>
    `;
    fragment.appendChild(div);
  });

  hairGrid.appendChild(fragment);
  itemsShown += batch.length;

  if (itemsShown >= currentRecommendations.length) {
    loadMoreContainer.classList.add("hidden");
  } else {
    loadMoreContainer.classList.remove("hidden");
  }
}
