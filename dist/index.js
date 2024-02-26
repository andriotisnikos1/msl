#!/usr/bin/env node
import { program } from "commander";
import main from "./main.js";
program
    .version("0.0.1")
    .description("MSL - Multi Script Lanucher")
    .argument("<script>", "script to run")
    .action(main)
    .parse(process.argv);
