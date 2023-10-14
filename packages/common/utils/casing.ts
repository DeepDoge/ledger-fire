export function toLocaleLowerCase(lang?: string) {
	return (value: string) => value.toLocaleLowerCase(lang)
}

// TODO: Gonna make this better later. My head hurts
export function toLocaleCapitalized(lang?: string) {
	function capitalize(value: string) {
		return `${value.charAt(0).toLocaleUpperCase(lang)}${value.slice(1)}`
	}

	return (value: string) => value.split(" ").map(capitalize).join(" ")
}
