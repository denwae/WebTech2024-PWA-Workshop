    console.log("Service Worker lädt")

    self.addEventListener("install", _ => {
        console.log("Service Worker installiert")
    })

    self.addEventListener("activate", _ => {
        console.log("Service Worker aktiviert")
    })
