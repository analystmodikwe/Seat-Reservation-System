import {  RESERVE_CONFIG } from "./config";
import{ HoldRepository } from "./repositories/holdRepository";


// here i am going to generate a 6 char code from the RESERVE_CONFIG.HOLD_CODE_CHARACTERS But it must follow the rules of RESERVE_CONFIG.HOLD_CODE_CHARACTERS it shouldnt contain any similar looking characters like 0 and O, 1 and I, L and 1, etc.

export interface CodeGenerator{
    generateCode() : string;
}

export class HoldCodeGenerator implements CodeGenerator {
    constructor(private holdRepository: HoldRepository) {}


    generateCode(): string {
        let code: string;
        do {
            code = this.randomCode();
        } while (this.holdRepository.findByCode(code) !== undefined)
        return code;
    }



    private randomCode(): string {
        let code = "";

        for (let i = 0; i < RESERVE_CONFIG.HOLD_CODE_LENGTH; i++) {
            const index = Math.floor(Math.random() * RESERVE_CONFIG.HOLD_CODE_CHARACTERS.length);

            // adding characters to the code
            code += RESERVE_CONFIG.HOLD_CODE_CHARACTERS[index];
        }

        return code;
    }
}

