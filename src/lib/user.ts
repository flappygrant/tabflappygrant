import { useEffect, useState } from "preact/hooks"

export type SearchEngine = {
    id: string
    name: string
    url: string
}

export type BackgroundImage = {
    id: string
    filename: string
    mime: string
}

const defaultSearchEngines: SearchEngine[] = [
    {
        id: crypto.randomUUID(),
        name: "Google",
        url: "https://google.com/search?q=%s",
    },
]

const bitmapCache = new Map<string, ImageBitmap>()

async function getBackgroundsDirectory() {
    const root = await navigator.storage.getDirectory()
    return await root.getDirectoryHandle("backgrounds", { create: true, })
}

async function saveBackgroundFile(file: File) {
    const directory = await getBackgroundsDirectory()
    const id = crypto.randomUUID()
    const extension = file.name.split(".").pop() || "jpg"
    const filename = `${id}.${extension}`
    const handle = await directory.getFileHandle(filename, { create: true, })
    const writable = await handle.createWritable()
    await writable.write(file)
    await writable.close()
    return { id, filename, mime: file.type, }
}

async function loadBackgroundFile(filename: string) {
    const cached = bitmapCache.get(filename)
    if (cached) return cached
    const directory = await getBackgroundsDirectory()
    const handle = await directory.getFileHandle(filename)
    const file = await handle.getFile()
    const bitmap = await createImageBitmap(file)
    bitmapCache.set(filename, bitmap)
    return bitmap
}

export default function useUser() {
    const [welcomeMessage, setWelcomeMessage] = useState("Click to edit this!")
    const [searchEngines, setSearchEngines] = useState<SearchEngine[]>(defaultSearchEngines)
    const [searchEngineId, setSearchEngineId] = useState(searchEngines[0].id)
    const [backgrounds, setBackgrounds] = useState<BackgroundImage[]>([])
    const [activeBackgroundId, setActiveBackgroundId] = useState<string | null>(null)
    const [backgroundBitmap, setBackgroundBitmap] = useState<ImageBitmap | null>(null)

    useEffect(() => {
        const message = localStorage.getItem("welcome-message")
        if (message) setWelcomeMessage(message)
        const engines = localStorage.getItem("search-engines")
        if (engines) setSearchEngines(JSON.parse(engines))
        const engine = localStorage.getItem("search-engine")
        if (engine) setSearchEngineId(engine)
        const bg = localStorage.getItem("backgrounds")
        if (bg) setBackgrounds(JSON.parse(bg))
        const activeBg = localStorage.getItem("active-background")
        if (activeBg) setActiveBackgroundId(activeBg)
    }, [])

    useEffect(() => {
        localStorage.setItem("welcome-message", welcomeMessage.trim())
    }, [welcomeMessage])

    useEffect(() => {
        localStorage.setItem("search-engines", JSON.stringify(searchEngines))
    }, [searchEngines])

    useEffect(() => {
        localStorage.setItem("search-engine", searchEngineId)
    }, [searchEngineId])

    useEffect(() => {
        localStorage.setItem("backgrounds", JSON.stringify(backgrounds))
    }, [backgrounds])

    useEffect(() => {
        if (activeBackgroundId) localStorage.setItem("active-background", activeBackgroundId)
        else localStorage.removeItem("active-background")
    }, [activeBackgroundId])

    useEffect(() => {
        if (!activeBackgroundId) {
            setBackgroundBitmap(null)
            return
        }

        const bg = backgrounds.find(b => b.id === activeBackgroundId)
        if (!bg) return
        const cached = bitmapCache.get(bg.filename)
        if (cached) {
            setBackgroundBitmap(cached)
            return
        }

        loadBackgroundFile(bg.filename).then(bitmap => {
            setBackgroundBitmap(bitmap)
        })
    }, [activeBackgroundId, backgrounds])

    function getSearchEngine() {
        return searchEngines.find(e => e.id === searchEngineId) ?? {
            id: "-1",
            name: "Unknown",
            url: "/?q=%s",
        }
    }

    async function addBackground(file: File) {
        const bg = await saveBackgroundFile(file)
        const bitmap = await createImageBitmap(file)
        bitmapCache.set(bg.filename, bitmap)
        setBackgrounds([...backgrounds, bg])
        setActiveBackgroundId(bg.id)
    }

    async function getActiveBackgroundBitmap() {
        const bg = backgrounds.find(b => b.id === activeBackgroundId)
        if (!bg) return null
        const cached = bitmapCache.get(bg.filename)
        if (cached) return cached
        const bitmap = await loadBackgroundFile(bg.filename)
        return bitmap
    }

    return {
        welcomeMessage,
        setWelcomeMessage,
        searchEngines,
        setSearchEngines,
        getSearchEngine,
        searchEngineId,
        setSearchEngineId,
        backgrounds,
        setBackgrounds,
        activeBackgroundId,
        setActiveBackgroundId,
        backgroundBitmap,
        addBackground,
        getActiveBackgroundBitmap,
    }
}
