import { WebBrowserView } from "./web_browser_view";

// TODO: Change this whole thing to use https://github.com/pjeby/monkey-around instead.
export class FunctionHooks {
	private static ogWindow$Open: (
		url?: string | URL,
		target?: string,
		features?: string
	) => WindowProxy | null;
    private static unRecordKeyPress: ()=>void;
	static onload() {
		FunctionHooks.ogWindow$Open = window.open;
        FunctionHooks.unRecordKeyPress =  FunctionHooks.recordKeyPress();
		window.open = (
			url?: string | URL,
			target?: string,
			features?: string
		): WindowProxy | null => {
			// TODO: Create setting for whether to open external links outside of Obsidian or not.
			// return FunctionHooks.ogWindow$Open.call(window, url, target, features);
            if(!FunctionHooks.commandOrCtrlPressed){
                return FunctionHooks.ogWindow$Open.call(window, url, target, features);
            }
			let urlString: string = "";
			if (typeof url === "string") {
				urlString = url;
			} else if (url instanceof URL) {
				urlString = url.toString();
			}

			// 1. Allows Obsidian to open a popup window if url is "about:blank" and features is not null
			// TODO: There might be a better way to detect if it's a popup window.
			// 2. Perform default behavior if the url isn't "http://" or "https://"
			// TODO: Change to `isWebUri()` when I change to use the valid-url library.
			if (
				(urlString === "about:blank" && features) ||
				(!urlString.startsWith("http://") &&
					!urlString.startsWith("https://") &&
					!urlString.startsWith("file://"))
			) {
				return FunctionHooks.ogWindow$Open.call(
					window,
					url,
					target,
					features
				);
			}

			// TODO: Open external link in current leaf when meta key isn't being held down.
			WebBrowserView.spawnWebBrowserView(true, { url: urlString });
			return null;
		};
	}

	static onunload() {
		// Clean up our hackiness when the plugin is disabled.
		window.open = FunctionHooks.ogWindow$Open;
        FunctionHooks.unRecordKeyPress?.();
	}
	static commandOrCtrlPressed = false;
	static recordKeyPress() {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey) {
				FunctionHooks.commandOrCtrlPressed = true;
			}
		};
		window.addEventListener("keydown", handleKeyDown);
        const handleKeyUp = (e: KeyboardEvent) => {
            FunctionHooks.commandOrCtrlPressed = false;
        };
		window.addEventListener("keyup", handleKeyUp);
        return ()=>{
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        }
	}
}
