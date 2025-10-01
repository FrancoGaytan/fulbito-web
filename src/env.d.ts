interface ImportMetaEnv {
	readonly VITE_API_BASE_URL: string
}
interface ImportMeta {
	readonly env: ImportMetaEnv
}

// Allow path alias '@/' (configured in vite.config.ts + tsconfig paths)
declare module '@/*' {}