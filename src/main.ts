import "colors";
import fsp from "fs/promises";
import parser from "./parser.js";
import {exec} from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

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

async function run(script: Script) {
    console.log(`running script: ${script.name}`.bgYellow);
    try {
        for (const command of script.commands) {
            console.log(`running: ${command}`.bgCyan);
            const { stdout, stderr } = await execAsync(command);
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
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

