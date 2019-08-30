/**
 * Transactions sent to the tic-tac-toe program contain commands that are
 * defined in this file:
 * - keys will vary by the specified Command
 * - userdata is a Command enum (as a 32 bit value) followed by a CommandData union.
 */
#pragma once

#include "program_types.h"

typedef enum {
    /*
     * init dashboard
     *
     * key[0] - dashboard account
     */
            Command_InitDashboard = 0,
    /*
     * Make bet
     *
     * key[0] - dashboard account
     * key[1] - game account
     * key[2] - player account
     */
            Command_Bet,
    /*
     * set seed hash
     *
     * key[0] - dashboard account
     * key[1] - game account
     * key[2] - casino account
     */
            Command_SetSeedHash,
    /*
     * set seed
     *
     * key[0] - dashboard account
     * key[1] - game account
     * key[2] - player account
     */
            Command_SetSeed,

    /*
     * Initialize a game account
     *
     * key[0] - dashboard account
     * key[1] - game account
     * key[2] - casino account
     * key[3] - player account
     */
            Command_Reveal,

    /*
     * Used by Player X to advertise their game
     *
     * key[0] - dashboard account
     * key[1] - game account
     * key[2] - player account
     *
     * CommandData: none
     */
            Command_Withdraw,

    /*
     * Used by Player X to advertise their game
     *
     * key[0] - dashboard account
     * key[1] - casino account
     *
     * CommandData: none
     */
            Command_Casino_Withdraw,

    /*
    * Force the enum to be 64 bits
    */
            Command_MakeEnum64Bits = 0xffffffffffffffff,

} Command;

typedef union {
    struct {
        uint64_t bet_lamports;
        uint8_t roll_under;
    } bet;
    uint8_t seed[SEED_SIZE];
    uint8_t casino_seed_hash[HASH_SIZE];
    uint64_t casino_withdraw_amount;
    SolPubkey key;
} CommandData;
