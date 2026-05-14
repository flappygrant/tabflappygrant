import { useEffect, useRef, useState } from "preact/hooks"
import useUser from "./lib/user"

const URL_REGEX = /^(https?:\/\/[^\s]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z0-9-]+(?:\/[^\s]*)?)$/

export default function App() {
    const user = useUser()
    const [query, setQuery] = useState("")
    const welcomeMessageRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const element = welcomeMessageRef.current
        if (!element) return
        element.style.width = "0px"
        element.style.width = `${element.scrollWidth}px`
    }, [user.welcomeMessage])

    function onSearch(event: SubmitEvent) {
        event.preventDefault()
        const q = query.trim()
        if (q === "") return
        if (q.match(URL_REGEX)) {
            let url = q
            if (!url.startsWith("http")) url = `https://${url}`
            window.location.href = url
            return
        }

        window.location.href = (user.getSearchEngine().url).replace(/\%s/g, encodeURIComponent(q))
    }

    function addSearchEngine() {
        function promptName() {
            const name = prompt("Enter the name:")
            if (name && name.trim()) return name.trim()
            else return "0EXIT"
        }

        function promptUrl() {
            while (true) {
                const url = prompt("Enter the URL\nExample:\nhttps://google.com/search?q=%s")
                if (!url || !url.trim()) return "0EXIT"
                if (url.startsWith("http") && url.includes("%s")) return url.trim()
            }
        }

        const id = crypto.randomUUID()
        const name = promptName()
        if (name === "0EXIT") return
        const url = promptUrl()
        if (url === "0EXIT") return
        const exists = user.searchEngines.some(e => e.name === name)
        if (exists) {
            alert("Search engine already added!")
            return
        }

        user.setSearchEngines([...user.searchEngines, { id, name, url, }])
        user.setSearchEngineId(id)
    }

    function uploadBackground() {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/*"
        input.addEventListener("change", event => {
            const files = (event.target as HTMLInputElement).files
            if (!files || files.length === 0) return
            user.addBackground(files[0])
        })

        input.click()
        input.remove()
    }

    return (
        <main className="bg-gray-900 text-white w-full h-screen overflow-hidden relative">
            {user.backgroundBitmap && <canvas ref={canvas => {
                if (!canvas) return
                const ctx = canvas.getContext("2d")!
                function update() {
                    if (!canvas || !user.backgroundBitmap) return
                    canvas.width = window.innerWidth
                    canvas.height = window.innerHeight

                    const img = user.backgroundBitmap
                    const canvasRatio = canvas.width / canvas.height
                    const imgRatio = img.width / img.height
                    let drawWidth = canvas.width
                    let drawHeight = canvas.height
                    let offsetX = 0
                    let offsetY = 0
                    if (imgRatio > canvasRatio) {
                        drawHeight = canvas.height
                        drawWidth = img.width * (canvas.height / img.height)
                        offsetX = (canvas.width - drawWidth) / 2
                    } else {
                        drawWidth = canvas.width
                        drawHeight = img.height * (canvas.width / img.width)
                        offsetY = (canvas.height - drawHeight) / 2
                    }

                    ctx.clearRect(0, 0, canvas.width, canvas.height)
                    ctx.drawImage(
                        img,
                        offsetX,
                        offsetY,
                        drawWidth,
                        drawHeight
                    )
                }

                update()
                window.addEventListener("resize", update)
            }} />}
            <div id="center" className="flex flex-col px-5 w-[400px] md:w-[600px] top-1/2 md:top-1/3 left-1/2 -translate-1/2 absolute">
                <input ref={welcomeMessageRef}
                    type="text"
                    value={user.welcomeMessage}
                    onInput={e => user.setWelcomeMessage(e.currentTarget.value)}
                    onKeyUp={e => e.key === "Enter" && e.currentTarget.blur()}
                    className="mx-auto max-w-full text-3xl outline-none" />

                <form onSubmit={onSearch} className="flex gap-0.5 mt-4 w-full">
                    <input type="text"
                        value={query}
                        onInput={e => setQuery(e.currentTarget.value)}
                        placeholder={`Search ${user.getSearchEngine().name}...`}
                        className="py-2 px-4 bg-white/10 backdrop-blur-xl hover:opacity-90 active:opacity-75 shadow-md outline-none rounded-l-md w-full"
                        autoFocus />

                    <select value={user.getSearchEngine().id}
                        onChange={e => user.setSearchEngineId(e.currentTarget.value)}
                        className="pl-4 bg-white/10 backdrop-blur-xl hover:opacity-90 active:opacity-75 shadow-md">
                        {user.searchEngines.map(engine => (
                            <option key={engine.id} value={engine.id}>
                                {engine.name}
                            </option>
                        ))}
                    </select>

                    <button type="button"
                        onClick={addSearchEngine}
                        className="px-4 bg-white/10 backdrop-blur-xl hover:opacity-90 active:opacity-75 shadow-md rounded-r-md">
                        +
                    </button>
                </form>
            </div>

            <div className="flex gap-0.5 bottom-5 right-5 fixed">
                <button
                    onClick={uploadBackground}
                    className={`py-1 px-2 bg-white/10 backdrop-blur-xl hover:opacity-90 active:opacity-75 shadow-md ${user.backgroundBitmap ? "rounded-l-md" : "rounded-md"}`}>
                    <span>Upload background</span>
                </button>

                {user.backgroundBitmap && (
                    <button onClick={() => user.setActiveBackgroundId(null)}
                        className="py-1 px-2 bg-white/10 backdrop-blur-xl hover:opacity-90 active:opacity-75 shadow-md rounded-r-md">
                        &times;
                    </button>
                )}
            </div>
        </main>
    )
}
