export default function parser(mslData) {
    try {
        const scriptsRaw = mslData.split("\n\n");
        const scripts = scriptsRaw.map((script) => {
            if (!script.startsWith("- "))
                return null;
            const lines = script.split("\n");
            const name = lines[0].slice(2);
            const commands = lines.slice(1).map((line) => {
                if (line.startsWith(" ") || line.startsWith("-")) {
                    console.warn(`warning: line "${line}" is not a valid command`.yellow);
                }
                return line;
            }).filter((line) => line !== null);
            return { name, commands };
        });
        return scripts.filter((script) => script !== null);
    }
    catch (error) {
        console.error("error: cannot parse msl".red);
        process.exit(1);
    }
}
