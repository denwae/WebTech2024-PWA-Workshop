console.info('Bleep Bloop 🤖 - hier spricht der ServiceWorker 🛠️')

// TODO: Definiert eine Variable die den Namen eures Caches enthält.
//       Hinweis: Wenn sich der Name des Caches ändert, wird ein neuer Cache erstellt und der alte gelöscht. (Also wenn das ganze richtig und ohne Speicher Leaks implementiert wurde :D)
const staticCache = 'static-cache-v1'

// TODO: Definiert ein Array mit den Dateien, die gecached werden sollen.
//       Achtung: Es müssen valide URLs sein, relativ zur start_url oder absolute URLs.
//       Tipp: Achtet darauf welche URLs auch wirklich aufgerufen werden. Nur exakte Matches funktionieren...
//             Wenn ihr nie `index.html` explizit aufruft, wird es auch keinen match geben
const filesToCache = [
    "./",
    "./index.html",
    "./style.css"
];

self.addEventListener('install', event => {
    console.info('Der ServiceWorker wird installiert 🛠️')

    // Statische Dateien in den statischen Cache cachen.
    // Das passiert asynchron, deshalb wird event.waitUntil() genutzt.
    // Hinweis: Es können mehrere caches genutzt werden, z.B. einer für statische Dateien, ein anderer für Assets oder JS Dateien. Dadurch können verschiedene Resourcen-Kategorien getrennt voneinander gecached und bei Bedarf aus dem Cache geworfen werden.
    event.waitUntil(
        caches.open(staticCache).then(cache => {
            return cache.addAll(filesToCache);
        })
    )
})

self.addEventListener('activate', event => {
    console.info('Der ServiceWorker wird aktiviert 🚀')

    // Hier werden alte Caches gelöscht, wenn sich die Version des Caches geändert hat.
    // Auch hier muss event.waitUntil() genutzt werden, da das Löschen von Caches asynchron passiert und der ServiceWorker sonst nicht startet.
    // Vorsicht: Wenn man mehrere Caches nutzt, muss sichergestellt werden, dass auch wirklich nur die alten Caches gelöscht werden!
    event.waitUntil(
        // TODO: Iteriert über alle Cache Keys und löscht alle, die nicht eurem oben definierten Cache Namen entsprechen.
        //       Vorsicht: Das Läschen von Caches ist asynchron, nutzt deshalb Promise.all() um sicherzustellen, dass alle Löschprozesse abgeschlossen sind.
        //       Nur dann wird der ServiceWorker aktiviert.
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== staticCache) {
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )
})

/**
 * Lädt die Datei aus dem Netzwerk und speichert sie im Cache, falls sie geladen wurde.
 *
 * Der Promise wird nach einem Timeout abgelehnt.
 *
 * @param request
 * @param timeout
 * @return {Promise<Response>}
 */
function tryToLoadFromNetworkAndUpdateCacheIfSuccessful(request, timeout = 10000) {
    console.info(`Versuche Datei ${request.url} aus dem Netzwerk zu laden... 🌐`)
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(reject, timeout)
        fetch(request).then(response => {
            clearTimeout(timeoutId)

            // TODO: Überprüft ob die Datei, die geladen wurde, eine ist, die gecached werden soll und wenn ja, updated den Cache.
            //       Hinweis: Nutzt einen Klon der Antwort (response.clone()), die Antwort ggf. Streams enthält die nur einmal genutzt werden können.
            if (staticFilesToCache.includes(request.url)) {
                updateStaticCache(request, response)
            }
            // Antwort der Response als Wert des Promises zurückgeben
            resolve(response)
        }).catch(reject)
    })
}

/**
 * Speichert die Antwort auf eine Anfrage im Cache
 *
 * @param request
 * @param response
 */
function updateStaticCache(request, response) {
    // TODO: Öffnet euren Cache und speichert die Antwort auf die Anfrage
    caches.open(staticCache).then(cache => {
        return cache.put(request, response)
    })
}

// Wenn eine Anfrage an das Netzwerk gestellt wird, wird zuerst versucht, die Datei aus dem Netzwerk zu laden.
// Wenn das nicht funktioniert, wird versucht, die Datei aus dem Cache zu laden.
self.addEventListener('fetch', event => {
    // TODO: Versucht die Datei aus dem Netzwerk zu laden. Wenn das nicht funktioniert, versucht die Datei aus dem Cache zu laden.
    //       Tipp: Nutzt event.respondWith() um die Antwort zu setzen.
    //       Hinweis: Falls der Cache nicht gefunden wird, sollte eine 404 Antwort zurückgegeben werden (e.g. `new Response(null, {status: 404, statusText: 'Not found'})`).
    //                Wenn dies nicht passiert, wirft der Browser einen Fehler und eure App lädt möglicherweise nicht korrekt.
    event.respondWith(tryToLoadFromNetworkAndUpdateCacheIfSuccessful(
            event.request, 10000).catch(() => {
            return caches.open(staticCache).then(cache => {
                return cache.match(event.request, {ignoreSearch: true}).then(response => {
                    return response || new Response(null, {status: 404, statusText: 'Not Found'})
                })
            })
        })
    )
});
