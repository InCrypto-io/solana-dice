<template>
    <div class="container">
        <div v-for="message in messages">
            <div class="message">
                <div class="info" v-if="message.type === 'info'">
                    <span>{{message.message}} </span>
                    <el-button class="remove-button" @click="closeMessage(message.id)">X</el-button>
                </div>
                <div class="error" v-if="message.type === 'error'">
                    <span>{{message.message}} </span>
                    <el-button class="remove-button" @click="closeMessage(message.id)">X</el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
  export default {
    name: "message",
    methods: {
      closeMessage(id) {
        this.$store.commit('REMOVE_MESSAGE', id);
      }
    },
    computed: {
      messages() {
        return this.$store.state.messages;
      }
    }
  }
</script>

<style scoped>
    .container {
        background-color: transparent;
    }

    .message {
        width: 100%;
        font-size: 16px;
        display: flex;
        justify-content: center;

    }

    .info {
        color: white;
        background: #00FFAD;
        padding: 10px;
        margin: 5px;
        border-radius: 5px;
        width: 100%;
        display: flex;
        justify-content: space-between;
    }

    .error {
        color: white;
        background: #DE3162;
        padding: 10px;
        margin: 5px;
        border-radius: 5px;
        width: 100%;
        display: flex;
        justify-content: space-between;
    }

    .remove-button {
        color: white;
        background: #fffa;
        border-width: 0px;
        border-radius: 3px;
        margin: 2px;
        height: 30px;
        width: 30px;
        text-align: center;
    }
</style>