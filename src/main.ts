import "colors";
import fsp from "fs/promises";
import parser from "./parser.js";
import {spawn} from "child_process";

async function verifyFile() {
    try {
        await fsp.access(".msl");
    } catch (error) {
        console.error("error: cannot find .msl file".red);
        process.exit(1);
    }
}

interface Script {
    name: string;
    commands: string[];
}

async function executor(command: string) {
    return new Promise((resolve, reject) => {
        const [cmd, ...args] = command.split(" ");
        const child = spawn(cmd, args, {stdio: "inherit"});
        child.on("exit", (code) => {
            if (code === 0) {
                resolve(0);
            } else {
                reject();
            }
        });
        child.on("message", (message) => {
            console.log(message);
        })
        if (child.stdin)
        process.stdin.pipe(child.stdin);
    });
}

async function run(script: Script) {
    console.log(`running script: ${script.name}`.bgYellow);
    try {
        for await (const command of script.commands) {
            console.log(`running: ${command}`.bgCyan);
            await executor(command);
        }
    } catch (error) {
        console.error(`error: cannot run script "${script.name}"`.red);
    }
}

export default async function main(script: string) {
    try {
        await verifyFile();
        const data = await fsp.readFile(".msl", "utf-8");
        const scripts = parser(data);
        console.log(`running scripts: ${script}`.bgGreen);
        const scriptNames = script.split(",");
        for (const scriptName of scriptNames) {
            const currentScript = scripts.find((s) => s.name === scriptName);
            if (currentScript) {
                await run(currentScript);
            } else {
                console.error(`error: cannot find script "${scriptName}"`.red);
            }
        }
    } catch (error) {
        console.error("error: cannot run msl".red);
    }
}

