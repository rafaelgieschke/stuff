#!/bin/sh
true /*; exec node --input-type module --experimental-modules < "$0" "$@"; */;
// TODO: Will not have a usable stdin!

import fs from "fs";
console.log(fs);
