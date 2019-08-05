#include <solana_sdk.h>

#include "program_command.h"
#include "program_state.h"
#include "sha256.h"

SOL_FN_PREFIX void get_sha256_hash(
        uint8_t *buf,
        uint32_t size,
        uint8_t result[32]
) {
    sha256_context ctx;

    sha256_starts(&ctx);
    sha256_update(&ctx, buf, size);
    sha256_finish(&ctx, result);
}

SOL_FN_PREFIX uint8_t compute_random_roll(
        uint8_t seed[32]
) {
    uint8_t result = 0x00;
    for (int i = 0; i < 32; i++)
        result ^= seed[i];
    return result % 100 + 1;
}

SOL_FN_PREFIX uint64_t
compute_reward(
        uint64_t
bet,
uint8_t roll
) {
return ((uint64_t) bet) * 98 / ((uint64_t)roll - 1);
}

SOL_FN_PREFIX bool init_dashboard(
        Dashboard *dashboard,
        CommandData const *cmd_data
) {
    if (dashboard->init_complete) {
        sol_log("Error: dashboard already initialized");
        return false;
    }

    sol_memcpy(dashboard->casino.x, cmd_data->key.x, SIZE_PUBKEY);
    sol_memset(dashboard->current_game_public_key.x, 0, SIZE_PUBKEY);
    dashboard->count_games = 0;
    dashboard->init_complete = true;
    sol_log("dashboard initialized");
    return true;
}

SOL_FN_PREFIX bool make_bet(
        SolKeyedAccount *dashboard_account,
        Dashboard *dashboard,
        SolKeyedAccount *game_account,
        Game *game,
        SolKeyedAccount *player,
        uint64_t current_slot,
        CommandData const *cmd_data
) {
    if (!player->is_signer) {
        sol_log("Error: player not sign transaction");
        return false;
    }
    if (game->state != GameState_Uninitialized) {
        sol_log("Error: game already initialized");
        return false;
    }
    if (cmd_data->bet.roll_under < 2 || cmd_data->bet.roll_under > 96) {
        sol_log("Error: wrong roll under");
        return false;
    }
    if (cmd_data->bet.bet_lamports == 0 || cmd_data->bet.bet_lamports > *(game_account->lamports)) {
        sol_log("Error: wrong bet");
        sol_log_64(cmd_data->bet.bet_lamports, *(game_account->lamports), 0, 0, 0);
        return false;
    }
    sol_memcpy(game->previous_game_public_key.x, dashboard->current_game_public_key.x, SIZE_PUBKEY);
    sol_memcpy(dashboard->current_game_public_key.x, game_account->key->x, SIZE_PUBKEY);
    game->state = GameState_Bet;
    game->bet_lamports = cmd_data->bet.bet_lamports;
    game->roll_under = cmd_data->bet.roll_under;
    game->lock_in_slot = current_slot;
    game->number_of_game = dashboard->count_games;
    game->roll = 0xff;
    game->reward_lamports = 0;
    dashboard->count_games++;
    *(dashboard_account->lamports) += game->bet_lamports;
    *(game_account->lamports) -= game->bet_lamports;
    sol_memcpy(&(game->player), player->key, SIZE_PUBKEY);
    sol_log("bet created");
    return true;
}

SOL_FN_PREFIX bool set_seed_hash(
        Dashboard *dashboard,
        Game *game,
        SolKeyedAccount *casino,
        CommandData const *cmd_data
) {
    if (!casino->is_signer) {
        sol_log("Error: casino not sign transaction");
        return false;
    }
    if (game->state != GameState_Bet) {
        sol_log("Error: game not in bet state");
        return false;
    }
    if (SolPubkey_same(casino->key, &(dashboard->casino)) == false) {
        sol_log("Error: wrong casino account");
        return false;
    }
    game->state = GameState_SetSeedHash;
    sol_memcpy(game->casino_seed_hash, cmd_data->casino_seed_hash, HASH_SIZE);
    sol_log("has seed hash");
    return true;
}

SOL_FN_PREFIX bool set_seed(
        Game *game,
        SolKeyedAccount *player,
        CommandData const *cmd_data
) {
    if (!player->is_signer) {
        sol_log("Error: player not sign transaction");
        return false;
    }
    if (game->state != GameState_SetSeedHash) {
        sol_log("Error: casino seed hash unknown");
        return false;
    }
    if (SolPubkey_same(player->key, &(game->player)) == false) {
        sol_log("Error: wrong player account");
        return false;
    }
    game->state = GameState_SetSeed;
    sol_memcpy(game->seed, cmd_data->seed, SEED_SIZE);
    sol_log("has seed");
    return true;
}

SOL_FN_PREFIX bool make_reveal(
        SolKeyedAccount *dashboard_account,
        Dashboard *dashboard,
        Game *game,
        SolKeyedAccount *casino,
        SolKeyedAccount *player,
        CommandData const *cmd_data
) {
    if (!casino->is_signer) {
        sol_log("Error: casino not sign transaction");
        return false;
    }
    if (game->state != GameState_SetSeed) {
        sol_log("Error: game state not in setSeed");
        sol_log_64(game->state, 0, 0, 0, 0);
        return false;
    }
    if (SolPubkey_same(casino->key, &(dashboard->casino)) == false) {
        sol_log("Error: wrong casino account");
        return false;
    }
    uint8_t calculated_hash[HASH_SIZE];
    get_sha256_hash((uint8_t *) cmd_data->seed, SEED_SIZE, calculated_hash);

    if (sol_memcmp(game->casino_seed_hash, calculated_hash, HASH_SIZE) != 0) {
        sol_log("Error: casino seed hash");
        sol_log_array(game->casino_seed_hash, HASH_SIZE);
        sol_log("Error: calculated hash");
        sol_log_array(calculated_hash, HASH_SIZE);
        sol_log("Error: wrong casino seed");
        return false;
    }

    uint8_t all_seeds[2 * SEED_SIZE];
    sol_memcpy(all_seeds, cmd_data->seed, SEED_SIZE);
    sol_memcpy(all_seeds + SEED_SIZE, game->seed, SEED_SIZE);
    get_sha256_hash(all_seeds, 2 * SEED_SIZE, calculated_hash);

    game->roll = compute_random_roll(calculated_hash);

    get_sha256_hash(calculated_hash, HASH_SIZE, calculated_hash);
    game->roll = compute_random_roll(calculated_hash);

    sol_log("roll");
    sol_log_64(game->roll, 0, 0, 0, 0);
    if (game->roll < game->roll_under) {
        sol_log("Info: player win");
        uint64_t reward_lamports = compute_reward(game->bet_lamports, game->roll_under);
        if (*(dashboard_account->lamports) < reward_lamports) {
            sol_log("Error: reward more than available balance");
            sol_log_64(reward_lamports, game->bet_lamports, game->roll, game->roll_under, 0);
            return false;
        }
        game->reward_lamports = reward_lamports;
        *(player->lamports) += game->reward_lamports;
        *(dashboard_account->lamports) -= game->reward_lamports;
        sol_log_64(game->reward_lamports, game->bet_lamports, game->roll, game->roll_under, 0);
    } else {
        sol_log("Info: no reward player lose");
    }
    game->state = GameState_Reveal;
    sol_log("have revealed");
    return true;
}

SOL_FN_PREFIX bool make_withdraw(
        SolKeyedAccount *dashboard_account,
        Dashboard *dashboard,
        Game *game,
        SolKeyedAccount *player,
        uint64_t current_slot,
        CommandData const *cmd_data
) {
    if (!player->is_signer) {
        sol_log("Error: player not sign transaction");
        return false;
    }
    if (game->state != GameState_Bet) {
        sol_log("Error: game state not  in bet");
        return false;
    }
    sol_log("lock state");
    sol_log_64(game->lock_in_slot, current_slot, current_slot - game->lock_in_slot, 0, 0);
    if (current_slot - game->lock_in_slot < 10) {
        sol_log("Error: locked");
        return false;
    }

    if (SolPubkey_same(player->key, &(game->player)) == false) {
        sol_log("player->key");
        sol_log_key(player->key);
        sol_log("game->player");
        sol_log_key(&(game->player));
        sol_log("Error: wrong player account");
        return false;
    }

    *(player->lamports) += game->bet_lamports;
    *(dashboard_account->lamports) -= game->bet_lamports;
    game->state = GameState_Withdraw;
    sol_log("have withdraw");
    return true;
}

SOL_FN_PREFIX bool make_casino_withdraw(
        Dashboard *dashboard,
        Game *game,
        SolKeyedAccount *casino,
        CommandData const *cmd_data
) {
    sol_log("++++++make_casino_withdraw+++++++");
    return false;
}

extern bool entrypoint(const uint8_t *input) {
    SolKeyedAccount ka[4];
    SolParameters params = (SolParameters) {.ka = ka};

    sol_log("+++++++++++++DiceGame++++++++++++++++++++++");

    if (!sol_deserialize(input, &params, SOL_ARRAY_SIZE(ka))) {
        sol_log("Error: deserialize failed");
        return false;
    }

    sol_log_params(&params);

    sol_log("Size of Dashborad");
    sol_log_64(sizeof(Dashboard), 0, 0, 0, 0);

    sol_log("Size of Game");
    sol_log_64(sizeof(Game), 0, 0, 0, 0);

    sol_log("Size of Comand + CommandData");
    sol_log_64(sizeof(uint32_t) + sizeof(CommandData), 0, 0, 0, 0);

    Command const cmd = *(uint32_t *) params.data;
    CommandData const *cmd_data = (CommandData *) (params.data + sizeof(uint32_t));
/////
    sol_log("Command:");
    sol_log_64(cmd, 0, 0, 0, 0);
    sol_log("Command data:");
    sol_log_array((const uint8_t *) cmd_data, sizeof(CommandData));
    sol_log("---------------------------");
/////

    if (params.data_len < sizeof(uint32_t) + sizeof(CommandData)) {
        if (params.data_len < sizeof(uint32_t)
            || (cmd != Command_Withdraw
                && cmd != Command_Casino_Withdraw
                && cmd != Command_InitDashboard)) {
            sol_log("Error: invalid instruction_data_len");
            sol_log_64(params.data_len, sizeof(uint32_t) + sizeof(CommandData), 0, 0, 0);
            return false;
        }
    }

    Dashboard *dashboard = NULL;
    SolKeyedAccount *dashboard_account = &ka[0];
    if (!dashboard_deserialize(&ka[0], &dashboard)) {
        sol_log("Error: invalid dashboard account");
        return false;
    }

    Game *game = NULL;
    if (params.ka_num >= 2 && !game_deserialize(&ka[1], &game)) {
        sol_log("Error: invalid game account");
        return false;
    }
    SolKeyedAccount *game_account = &ka[1];

    if (params.ka_num >= 3 && !ka[2].is_signer) { // player or casino
        sol_log("Transaction not signed by key 2");
        return false;
    }

    const SolPubkey syscall_current_publicKey = {
            // Sysca11Current11111111111111111111111111111
            .x = {0x06, 0xa7, 0xd3, 0x8a, 0x45, 0xda, 0x0e, 0xb8, 0x22, 0x32, 0xbc, 0x21,
                  0xc9, 0x31, 0x3f, 0x0d, 0x0f, 0xc1, 0x21, 0x84, 0xd0, 0xee, 0x81, 0xe0,
                  0x65, 0x43, 0x0e, 0x0b, 0xa0, 0x00, 0x00, 0x00}
    };
    if ((cmd == Command_Bet || cmd == Command_Withdraw)
        && SolPubkey_same(ka[3].key, &syscall_current_publicKey) == false) {
        sol_log("Wrong syscall current publicKey");
        return false;
    }

    switch (cmd) {
        case Command_InitDashboard: {
            return init_dashboard(dashboard, cmd_data);
        }
        case Command_Bet: {
            SolKeyedAccount *player = &ka[2];
            uint64_t current_slot = *(uint64_t * )(ka[3].userdata);
            return make_bet(dashboard_account,
                            dashboard,
                            game_account,
                            game,
                            player,
                            current_slot,
                            cmd_data);
        }
        case Command_SetSeedHash: {
            SolKeyedAccount *casino = &ka[2];
            return set_seed_hash(dashboard,
                                 game,
                                 casino,
                                 cmd_data);
        }
        case Command_SetSeed: {
            SolKeyedAccount *player = &ka[2];
            return set_seed(game,
                            player,
                            cmd_data);
        }
        case Command_Reveal: {
            SolKeyedAccount *casino = &ka[2];
            SolKeyedAccount *player = &ka[3];
            return make_reveal(dashboard_account, dashboard, game, casino, player, cmd_data);
        }
        case Command_Withdraw: {
            SolKeyedAccount *player = &ka[2];
            uint64_t current_slot = *(uint64_t * )(ka[3].userdata);
            return make_withdraw(dashboard_account,
                                 dashboard,
                                 game,
                                 player,
                                 current_slot,
                                 cmd_data);
        }
        case Command_Casino_Withdraw: {
            SolKeyedAccount *casino = &ka[2];
            return make_casino_withdraw(dashboard,
                                        game,
                                        casino,
                                        cmd_data);
        }
        default: {
            sol_log("Error: Invalid command");
            return false;
        }
    }
}
