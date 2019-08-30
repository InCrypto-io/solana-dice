/**
 * Tic-tac-toe account userdata contains a State enum (as a 32 bit value) followed by a StateData union
 */

#pragma once

#include <solana_sdk.h>
#include "program_types.h"

typedef enum {
    GameState_Uninitialized = 0,
    GameState_Bet,
    GameState_SetSeedHash,
    GameState_SetSeed,
    GameState_Reveal,
    GameState_Withdraw,
    GameState_MakeEnum64Bits = 0xffffffffffffffff,
} State;

typedef struct {
    State state;
    SolPubkey player;
    uint8_t seed[SEED_SIZE];
    uint8_t casino_seed_hash[HASH_SIZE];
    uint64_t lock_in_slot;
    uint64_t bet_lamports;
    uint32_t roll_under;
    SolPubkey previous_game_public_key;
    uint32_t number_of_game;
    uint32_t roll;
    uint64_t reward_lamports;
} Game;

typedef struct {
    bool init_complete;
    uint32_t count_games;
    SolPubkey casino;
    SolPubkey current_game_public_key;
} Dashboard;

SOL_FN_PREFIX bool game_deserialize(SolKeyedAccount *ka, Game **game) {
    if (ka->userdata_len < sizeof(Game)) {
        sol_log("Error: invalid userdata_len");
        sol_log_64(ka->userdata_len, sizeof(Game), 0, 0, 0);
        return false;
    }
    *game = (Game *) ka->userdata;
    return true;
}

SOL_FN_PREFIX bool dashboard_deserialize(SolKeyedAccount *ka, Dashboard **dashboard) {
    if (ka->userdata_len < sizeof(Dashboard)) {
        sol_log("Error: invalid userdata_len");
        sol_log_64(ka->userdata_len, sizeof(Dashboard), 0, 0, 0);
        return false;
    }
    *dashboard = (Dashboard *) ka->userdata;
    return true;
}
