import O from "axios"
import { SHA256 as D } from "crypto-js"
var C = Object.defineProperty
var Z = (t, e, n) => e in t ? C(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n
var m = (t, e, n) => Z(t, typeof e != "symbol" ? e + "" : e, n)

const P = "ChainMeet", k = "ChainPalForPC", { userAgent: d } = window.navigator, f = d.indexOf(P) > -1, F = d.indexOf(k) > -1, L = f ? d.indexOf("en-US") > -1 ? "en-US" : d.indexOf("zh-CH") > -1 ? "zh-CH" : "" : "", Q = /MicroMessenger/i.test(d), u = f ? d.indexOf("en-US") > -1 ? "en" : "zh" : Q ? d.indexOf("Language/en") > -1 ? "en" : "zh" : navigator.language.indexOf("zh") > -1 ? "zh" : "en", U = (t, e) => {
  window.location.href = t
  let n = +/* @__PURE__ */ new Date(), r = 0, i = 0, a = setInterval(() => {
    // eslint-disable-next-line
    r++, i = +/* @__PURE__ */ new Date() - n, i > 1e3 && (e && e(!0), a && clearInterval(a)), !(r < 1e3) && (document.hidden || e && e(!0))
  }, 20)
  document.addEventListener("visibilitychange", () => {
    // eslint-disable-next-line
    document.hidden && (e && e(!1), a && clearInterval(a))
  })
}, w = (() => {
  if (d.indexOf("appVersion") > -1) {
    let t = d.match(/appVersion=(\d+\.){2}\d+/g)
    return t ? (console.log(t[0].split("=")[1]), t[0].split("=")[1]) : ""
  }
  return ""
})(), B = (t, e) => {
  let n = t.split("."), r = e.split(".")
  for (let i = 0; i < Math.max(n.length, r.length); i++) {
    let a = parseInt(n[i] || "0"), s = parseInt(r[i] || "0")
    if (a < s)
      return -1
    if (a > s)
      return 1
  }
  return 0
}, M = {
  LightApplication: "chainMeetCheckAccount",
  RecordingToString: "recordingToStringResult",
  CloudFileSelector: "cloudFileSelectResult",
  GetLocalGroupChatList: "localGroupChatListResult",
  GetWebsiteInfo: "websiteInfoResult",
  getIOSEnvironmentInfo: "chainMeetiosList",
  GetAppList: "chainMeetAppList",
  CheckStoragePermission: "storagePermissionResult",
  CheckCameraPermission: "cameraPermissionResult",
  ScanBusinessCard: "scanBusinessCardResult",
  DtcAccountPassword: "dtcAccountPasswordResult",
  CheckDtcAccount: "checkDtcAccountResult",
  GetContractWallet: "contractWalletListResult",
  GetDTCBalance: "dtcBalanceResult",
  RechargeDTCTransfer: "dtcTransferResult",
  RechargeRMBTransfer: "rmbTransferResult"
}, I = [
  "OpenSingleConversation_v2",
  "ChatToFriend_v2"
], A = {
  osc: "OpenSingleConversation",
  osc2: "OpenSingleConversation_v2",
  ctf: "ChatToFriend",
  ctf2: "ChatToFriend_v2"
}, y = {
  mobile: "legion://legion.tongfudun.com",
  pc: "legionpc://legion.tongfudun.com"
}, E = window.navigator.userAgent.toLowerCase()
function b(t, e) {
  return t.indexOf(e) !== -1
}
function l(t) {
  return b(E, t)
}
const o = {
  macos: function () {
    return l("mac")
  },
  ios: function () {
    return o.iphone() || o.ipod() || o.ipad()
  },
  iphone: function () {
    return !o.windows() && l("iphone")
  },
  ipod: function () {
    return l("ipod")
  },
  ipad: function () {
    const t = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1, e = !o.iphone() && "ontouchend" in document
    return l("ipad") || t || e
  },
  android: function () {
    return !o.windows() && l("android")
  },
  androidPhone: function () {
    return o.android() && l("mobile")
  },
  androidTablet: function () {
    return o.android() && !l("mobile")
  },
  blackberry: function () {
    return l("blackberry") || l("bb10")
  },
  blackberryPhone: function () {
    return o.blackberry() && !l("tablet")
  },
  blackberryTablet: function () {
    return o.blackberry() && l("tablet")
  },
  windows: function () {
    return l("windows")
  },
  windowsPhone: function () {
    return o.windows() && l("phone")
  },
  windowsTablet: function () {
    return o.windows() && l("touch") && !o.windowsPhone()
  },
  fxos: function () {
    return (l("(mobile") || l("(tablet")) && l(" rv:")
  },
  fxosPhone: function () {
    return o.fxos() && l("mobile")
  },
  fxosTablet: function () {
    return o.fxos() && l("tablet")
  },
  meego: function () {
    return l("meego")
  },
  mobile: function () {
    return o.androidPhone() || o.iphone() || o.ipod() || o.windowsPhone() || o.blackberryPhone() || o.fxosPhone() || o.meego()
  },
  tablet: function () {
    return o.ipad() || o.androidTablet() || o.blackberryTablet() || o.windowsTablet() || o.fxosTablet()
  },
  desktop: function () {
    return !o.tablet() && !o.mobile()
  },
  portrait: function () {
    return window.screen.orientation && Object.prototype.hasOwnProperty.call(window, "onorientationchange") ? b(window.screen.orientation.type, "portrait") : o.ios() && Object.prototype.hasOwnProperty.call(window, "orientation") ? Math.abs(window.orientation) !== 90 : window.innerHeight / window.innerWidth > 1
  },
  landscape: function () {
    return window.screen.orientation && Object.prototype.hasOwnProperty.call(window, "onorientationchange") ? b(window.screen.orientation.type, "landscape") : o.ios() && Object.prototype.hasOwnProperty.call(window, "orientation") ? Math.abs(window.orientation) === 90 : window.innerHeight / window.innerWidth < 1
  }
}
class p {
  // production
  // static HTTPS = 'http://imtest.tongfudun.com:7081'  // develop
}
// eslint-disable-next-line
m(p, "APP_ID", "4IFH4nr5"), m(p, "SECRET_KEY", "f6819cb0e0c8c1ed86e5f5acc8bfe084c0f12235"), m(p, "SECRET_ID", "At5ipFo4"), m(p, "HTTPS", "https://beidou.tongfudun.com")
const g = O.create({
  baseURL: p.HTTPS,
  timeout: 3e5
})
function S(t) {
  if (!t) return ""
  let e = Object.keys(t).sort(), n = {}
  for (let i in e)
    n[e[i]] = t[e[i]]
  return Object.keys(n).map((i) => `${i}=${n[i] instanceof Array || n[i] instanceof Object ? JSON.stringify(n[i]) : n[i]}`).join("&")
}
g.interceptors.request.use(function (t) {
  let e = +/* @__PURE__ */ new Date(), n = p.SECRET_KEY, r = (S(t.data) ? `${S(t.data)}&` : "") + `secretKey=${n}&timestamp=${e}`, i = D(r)
  return t.headers["X-Header-App-ID"] = p.SECRET_ID, t.headers["X-Header-Signature"] = i.toString(), t.headers["X-Header-Timestamp"] = e, t.headers.os = "platform", t
}, function (t) {
  return Promise.reject(t)
})
g.interceptors.response.use((t) => {
  const { code: e, message: n, data: r } = t.data
  return e === "000000" ? r : Promise.reject(new Error(n))
}, (t) => Promise.reject(t))
const v = {
  get(t, e) {
    return g.get(t, e)
  },
  post(t, e, n) {
    return g.post(t, e, n)
  }
}
function G(t) {
  return v.post("/open/queryUserId", t)
}
const ee = async (t, e, n) => {
  var r, i, a
  if (f)
    try {
      if (I.includes(t) && e) {
        let { mobile: s, userId: c, email: h } = e;
        // eslint-disable-next-line
        (!w || w && B(w, "4.5.1") === -1) && s ? (r = window == null ? void 0 : window.ReactNativeWebView) == null || r.postMessage(
          JSON.stringify({
            name: t === A.osc2 ? A.osc : A.ctf,
            mobile: s.toString()
          })
        ) : (c || (c = (await G(
          s ? { mobile: s } : { email: h }
        )).userId), c && ((i = window == null ? void 0 : window.ReactNativeWebView) == null || i.postMessage(
          JSON.stringify({ name: t, userId: c })
        )))
      } else
        (a = window == null ? void 0 : window.ReactNativeWebView) == null || a.postMessage(
          JSON.stringify(e ? { name: t, ...e } : { name: t })
        )
      n && window && (window[M[t]] = n)
    } catch (s) {
      console.error(s)
    }
}
function q(t) {
  return Object.keys(t)
}
const te = (t, e, n) => {
  let r = ""
  if (!f) {
    let i = []
    // eslint-disable-next-line
    q(e).forEach(
      (a) => e[a] && i.push(`${a}=${e[a]}`)
      // eslint-disable-next-line
    ), r = o != null && o.mobile() || o != null && o.ipad() ? y.mobile : y.pc, U(`${r}/${t}?${i.join("&")}`, n)
  }
}, T = (t, e) => t.replace(
  new RegExp("chainmeetShare=[^&]*", "gi"),
  `chainmeetShare=${e}`
), ne = (t) => {
  if (f) {
    const { encodeURIComponent: e, btoa: n, location: r, history: i } = window, { search: a, hash: s } = r, c = n(unescape(e(JSON.stringify(t))))
    let h = ""
    // eslint-disable-next-line
    s ? h = s.indexOf("chainmeetShare") > -1 ? T(s, c) : `${s}${s.indexOf("?") > -1 ? "&" : "?"}chainmeetShare=${c}` : h = a.indexOf("chainmeetShare") > -1 ? T(a, c) : `${a}${a ? "&" : "?"}chainmeetShare=${c}`, i.replaceState(null, "", h)
  }
}, R = /Android/i.test(window.navigator.userAgent), V = {
  zh: {
    downloadTip: "若无法正常跳转请先点击【立即下载】按钮",
    //若无法正常跳转请先点击【立即下载】按钮
    downloadBtnText: "立即下载",
    //立即下载
    wxTip: "请点击右上角“更多”按钮，<br/>选择“在浏览器打开”",
    //请点击右上角“更多”按钮，<br/>选择“在浏览器打开”
    pcTip: "下载安装“大群空间”，一键快速加入“大群空间” <br/>更多版本请前往官网",
    //'下载安装“大群空间”，一键快速加入“大群空间” <br/>更多版本请前往官网'
    appName: "大群空间",
    //'大群空间'
    cancel: "取消",
    //'取消'
    download: "下载"
    //'下载'
  },
  en: {
    downloadTip: "If you cannot jump normally, <br /> please click the【 Download 】button.",
    downloadBtnText: "Download",
    wxTip: 'Please click the "More" button ,<br/> Choose "Open in Browser"',
    pcTip: "Download and install the ChainPal, one-click to quickly join the ChainPal <br> For more versions, please go to the official website",
    appName: "Legion",
    cancel: "Cancel",
    download: "Download"
  }
}, x = {
  tipDomCss: "background-color: #58c9f5;position: fixed;right: 10px;top: 20px;border-radius: 5px;padding: 20px;color: #ffffff;font-size: 12px;z-index: 2001;",
  tipDomEmCss: "width: 0;height: 0;border: 15px solid transparent;border-bottom-color: #58c9f5;position: absolute;right: 10px;top: -25px;z-index: 2001;",
  downloadDomCss: "position: fixed;top:0;left:0;right:0;bottom:0;z-index:2003;text-align: center;background-color: #fff;overflow: auto;padding-top: 90px;"
}, j = R ? "https://chat-minio.tongfudun.com/release/legion.apk" : "https://apps.apple.com/cn/app/id6747742179", N = "data:image/png;base64,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", z = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAABEVBMVEUAAABJSUlgYGBVVVVNTU1dXV1VVVVOTk5QUFBLWlpNWVlOWVlSUlJSUlxVVVVSUlJSUltPWFhQWFhNVVVSUlJOVVVTU1NRV1dPVVVRV1dQVVVRVVVOVlZQVFRRVVVQVFdQVlZRVFdRVFdQVlZQVlZPVFdRVFdPVFdQVVdQVFdRVVdRVVdQVFZQVlZPVFZQVlZQVVdPVFZRVlZQVFZRVlZQVVdPVlZQVVdQVlZRVVZQVVVRVVZQVVZQVVdQVVZQVVVRVVZQVVVQVVZQVVZQVVZQVVVQVVZPVVVQVVZRVVdQVVZQVVZQVVVQVVZQVVZQVVZQVVZQVVZRVVZQVVZQVVZQVVZQVVZQVVZPVVZQVVZQVVaE4r5pAAAAWnRSTlMABwgJCgsMDRARFBcZGRscHB0gISIkJSktLzM5O0BCRlBSVVZcYWFqbG14e4CMjo+Ql5idoaWnqKqrra6ys7u8vsXKzM3Oz9HS1NjZ3d/i5ebp6uzt9PX29/lM6N2iAAAA6ElEQVQYGX3BiToCUQAF4IPIFsm+ZN9d2TXWiFBJtizn/R9EX829kzrT/0OY2rmeRBvzJXIQ4RZ/SXYiVO8DyX2E2yP5NopwebKYRBvfP+dDkPqn46gaQdXATARNZj2Sd6klILGZLpHMbXegQYq+ryda93E4l1SuuuAzlDz4uj+pGFgrVE7hHFOZg/NBJQqnQqGAwCuFZwQKVMbhZKmswTmjctsDa5XSAaxhagbWDbWLMdQZamn4YmVKC7AMlUM4sTJbvU8gsMFWW2h0xGYn+C/Dmkr2hTW5KJqsP9JbTgDoS+4W8yaCuj+3S7iMeQbJqgAAAABJRU5ErkJggg==", K = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAVFBMVEUAAABOTk5VVVVVVVVQWFhNU1NPVVVOU1NQVVVRVVVQVFRQVFdRVFdSVVVRVFdQVVVQVVVQVFZQVFZPVFZQVVZQVVZQVVVPVVZRVVdQVVZQVVZQVVanqKYyAAAAG3RSTlMADRIbICgqLjM5QElMTltjZn+AjrK6v8fU3+iVHpjxAAAAoUlEQVQ4y9WT3Q6DIAyFq3N/6Nws6tj6/u85imYKtNkNN/sSCuEcDiEpACW5ZYuE2S4zzorhTNfT/XEBOmp3IAVQ0x2tOFkf6cso6Z0/GTK4dnLAZpAi3rTjJRgGHDy4kogt9oAR0GMbPdABRYStDd5JDDz+zPDzmYB1aqizrkgMOXavW6khGuMVE0qj9FyIlvNLGSZ6cplUQ2UOXKqiHxo+bQkjBKPMaR4AAAAASUVORK5CYII=", W = () => {
  let t = '<em></em><div class="wx-tip">' + V[u].wxTip + "</div>", e = document.querySelector(".wx-tip-wrap")
  if (!e) {
    let n = document.createElement("div")
    // eslint-disable-next-line
    n.classList.add("wx-tip-wrap"), document.body.appendChild(n), e = document.querySelector(".wx-tip-wrap")
  }
  if (e) {
    e.innerHTML = t
    let n = e.querySelector(".wx-tip")
    // eslint-disable-next-line
    n.style.cssText = "text-align: center;line-height: 20px;", e.style.cssText = x.tipDomCss
    let r = e.querySelector("em")
    r.style.cssText = x.tipDomEmCss
  }
}, Y = () => {
  let t = '<p class="cell-app-name" style=" font-size: 24px;line-height: 32px;color: #505556;padding:0 8px;margin:2px 0 0;">' + V[u].appName + "</p>", e = '<p class="text" style="line-height: 24px;font-size: 12px;color: #999;margin: 20px 40px;">' + V[u].downloadTip + "</p>", n = '<img src="" style="width: 120px;height: 120px;display: inline-block;"  class="legion-logo"/><figure class="cell-container" style=" margin-top:20px;line-height: 32px;display: flex;justify-content: center;align-items: center;"><img src="" class="cell-platform"  style=" width: 32px;height: 32px;"/>' + t + '</figure><div class="line" style=" border-bottom: 1px solid #ddd;margin: 50px 40px 0;-webkit-transform: scaleY(.5);transform: scaleY(.5);"></div>' + e + '<a class="action-btn" href="" style="text-decoration: none;margin: 30px auto 0;display: block;width: 280px;height: 50px;line-height: 50px;font-size: 18px;color: #fff;background-color: #448bfb;border-radius: 4px;"></a>', r = document.querySelector(
    ".chainpal-download-page"
  )
  if (!r) {
    let i = document.createElement("div")
    // eslint-disable-next-line
    i.classList.add("chainpal-download-page"), document.body.appendChild(i), i.innerHTML = n, r = document.querySelector(
      ".chainpal-download-page"
    )
  }
  if (r) {
    let i = r.querySelector(
      ".action-btn"
    )
    // eslint-disable-next-line
    r.style.display = "block", i.innerHTML = V[u].downloadBtnText, i.href = j
    let a = r.querySelector(".legion-logo"), s = r.querySelector(
      ".cell-platform"
    )
    // eslint-disable-next-line
    a.src = N, s.src = R ? K : z, r.style.cssText = x.downloadDomCss
  }
}, H = () => {
  let t = '<div class="mask" style="position: fixed;left: 0;top: 0;bottom: 0;width: 100%;background: rgba(0, 0, 0, 0.5);z-index: 20;"></div><div class="content" style="padding: 12px 25px;background: #fff;border-radius: 17px;border-radius: 5px;z-index: 100;position: absolute;box-sizing: border-box;left: 50%;top: 50%;transform: translate(-50%, -50%);text-align: center;"><p class="text" style="text-align: center;font-size: 16px;color:#333;line-height:26px;"></p><div class="btn" style="cursor: default;border-top: 1px solid #eee;text-align:center;padding-top:10px;display:flex;justify-content: space-around;font-size:14px;color:#666;"><span class="cancel" style="height:30px;line-height:30px;flex:1;" ></span><span class="confirm" style="color:#1dbb88;height:30px;line-height:30px;border-left:1px solid #eee;flex:1;"></span></div>', e = document.querySelector(".chainpal-modal-wrap")
  if (!e) {
    let n = document.createElement("div")
    // eslint-disable-next-line
    n.classList.add("chainpal-modal-wrap"), document.body.appendChild(n), n.innerHTML = t, e = document.querySelector(".chainpal-modal-wrap")
  }
  if (e) {
    let n = function () {
      // eslint-disable-next-line
      r.innerHTML = "", a.innerHTML = "", s.innerHTML = "", document.body.removeChild(e)
    }, r = e.querySelector(".text"), i = e.querySelector(".content"), a = i.querySelector(".cancel"), s = i.querySelector(".confirm")
    // eslint-disable-next-line
    e.style.cssText = "position: fixed;left: 0;top: 0;bottom: 0;width: 100%;z-index: 2001;", e.style.display = "block", r.innerHTML = V[u].pcTip, a.innerHTML = V[u].cancel, s.innerHTML = V[u].download, s.addEventListener("click", function () {
      // eslint-disable-next-line
      n(), window.open("https://space.tongfudun.com/#download")
    }), a.addEventListener("click", function () {
      n()
    }), e.querySelector(".mask").addEventListener("click", function () {
      n()
    })
  }
}, oe = () => {
  // eslint-disable-next-line
  Q ? W() : o != null && o.mobile() || o != null && o.ipad() ? Y() : H()
}, ie = {
  app: f,
  pc: F,
  language: L
}
export {
  ee as callNativeMethods,
  te as callUrlScheme,
  ie as client,
  oe as invokeAppFailCallback,
  ne as setChainmeetShare
}
