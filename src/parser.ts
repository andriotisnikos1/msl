type varSrc = "env" | "var" | "args"

type scriptScruct = { name: string, commands: string[] }[]

export default function parser(mslData: string) {
    try {
        // init parser
        let variables: [string, string][] = []
        const rows = mslData.split("\n\n")
        // start modifing the scripts
        const scripts = rows.map((script) => {
            // line is a variable definition - begin parsing
            if (script.startsWith("def")) {
                // variables may be defined one under another so \n\n is not a good separator
                const varDefs = script.split("\n")
                for (let i = 0; i < varDefs.length; i++) {
                    const v = varDefs[i]
                    const parsedVar = parseDefVar(v)
                    if (parsedVar !== null) variables.push(parsedVar)
                }
                return null
            }
            // end of variable definition
            // begin parsing script
            if (!script.startsWith("- ")) return null;
            const lines = script.split("\n");
            const name = lines[0].slice(2);
            // filter out invalid commands
            const commands = lines.slice(1).map((line) => {
                if (line.startsWith(" ") || line.startsWith("-")) {
                    console.warn(`warning: line "${line}" is not a valid command`.yellow);
                }
                return line
            }).filter((line) => line !== null) as string[]
            return { name, commands } 
        })
        // filter out invalid scripts and apply variables
        const parsed = scripts.filter((script) => script !== null) as scriptScruct
        return applyVariables(parsed, variables)
    } catch (error) {
        console.error("error: cannot parse msl".red);
        process.exit(1);
    }
}

function keepOrReplace(part: string, variables: [string, string][]): string {
    try {
        // init
        const parts = part.split(":")
        const source = parts[0] as varSrc
        const name = parts[1]
        if (parts.length !== 2) return "$" + part
        // replace based on source
        switch (source) {
            case "args":
                return process.argv[Number(name) + 2] || "$" + part
            case "env":
                const env = process.env[name]
                if (!env) return "$" + part
                return env
            case "var":
                const variable = variables.find((v) => v[0] === name)
                if (!variable) return "$" + part
                return variable[1]
            default:
                return "$" + part
        }
    } catch (error) {
        console.warn("warning: cannot replace variable: ".yellow + String(error).yellow);
        return part
    }
}

function applyVariables(script: scriptScruct, variables: [string, string][]): scriptScruct {
    try {
        return script.map((s) => {
            const commands = s.commands.map(c => {
                // if no variables are present in the command, return it as is
                if (!c.includes("$")) return c
                const parts = c.split(" ")
                // reconstruct the command with replaced variables
                let cmd = ""
                for (let i = 0; i < parts.length; i++) {
                    const p = parts[i]
                    // if no variables are present in the part, return it as is
                    if (!p.includes("$")) {
                        cmd += p + " "
                        continue
                    }
                    // replace variables in the part
                    const dollarSignParts = p.split("$")
                    let parsed = dollarSignParts.map((part) => keepOrReplace(part, variables)).join("")
                    if (parsed.startsWith("$") && parsed[0] === "$") parsed = parsed.slice(1)
                    cmd += parsed + " "
                }
                return cmd
            })
            return { name: s.name, commands }
        })
    } catch (error) {
        console.log("error: cannot apply variables: ".red + String(error).yellow);
        process.exit(1)
    }
}


function parseDefVar(variable: string): [string, string] | null {
    try {
        const parts = variable.split(" ")
        if (parts.length < 3) throw new Error("failed to parse variable (syntax error: definition statement): " + variable.yellow)
        const sourceAndName = parts[1].split(":")
        if (sourceAndName.length !== 2) throw new Error("failed to parse variable (syntax error: no source or name): " + variable.yellow)
        const source = sourceAndName[0] as varSrc
        const _name = sourceAndName[1]
        const value = parts.slice(2).join(" ")
        switch (source) {
            case "args":
                throw new Error("cannot define argument variables: " + variable.yellow)
            case "env":
                process.env[_name] = value;
                return null;
            case "var":
                return [_name, value]
            default:
                throw new Error("invalid variable source: " + (source as string).yellow)

        }
    } catch (error) {
        console.error("error: ".red + String(error).red);
        return null
    }
}