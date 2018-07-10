import Vue from 'vue/dist/vue.js';

var products = [
  {
    name: 'SkullCandy Blazin\' Buds',
    attributes: {
      'Price': '$250',
      'Rating': '3/5',
      '# Ratings': '359'
    }
  },
  {
    name: 'Bose QuietComfort 25',
    attributes: {
      'Price': '$350',
      'Rating': '4/5',
      '# Ratings': '359'
    }
  },
]

var tasks = [
    {
        "Question": "",
        "Answers": "",
        "Tokens": "1"
    },
  {
    "Question": "The cow jumped over the ____",
    "Answers": "moon, Moon",
    "Tokens": "1"
  },
  {
    "Question": "What is the colour of the sky?",
    "Answers": "blue, Blue, black, Black",
    "Tokens": "2"
  }
]

Vue.component('product-attribute-row', {
  props: ['attribute', 'unlockedMap', 'unlockAttribute'],
  computed: {
    unlocked() {
      return this.unlockedMap[this.attribute.name];
    }
  },
  template: `
    <tr @click="unlockRow(attribute.name)">
      <td>{{ attribute.name }}</td>
      <td v-for="value in attribute.values">
        {{ unlocked ? value : '' }}
      </td>
    </tr>
  `,
  methods: {
    unlockRow: function(attributeName) {
      this.unlockAttribute(attributeName);
    },
  }
})

// products => render
// state of visibility
Vue.component('product-table', {
  props: ['unlockedMap', 'unlockAttribute'],
  data: function () {
    return {
      products: products
    }
  },
  computed: {
    productAttributes: function () {
      let _products = this.products;
      let attributeNames = Object.keys(products[0].attributes);
      return attributeNames.map(attributeName => {
        return {
          name: attributeName,
          values: _products.map(product => product.attributes[attributeName])
        }
      });
    }
  },
  template: `
          <table class="ui selectable celled definition table">
            <thead>
              <tr><th></th>
                <th v-for="product in products">
                    {{product.name}}
                </th>
              </tr></thead>
              <tbody>
                <product-attribute-row
                  v-for="attribute in productAttributes"
                  v-bind:attribute="attribute"
                  v-bind:unlockAttribute="unlockAttribute"
                  v-bind:unlockedMap="unlockedMap"
                  v-bind:key="attribute.name">
                </product-attribute-row>
              </tbody>
          </table>
  `
})

Vue.component('task-card', {
    props: ['task', 'index', 'setUnlockable', 'renderTask'],
    data() {
        return {
            taskInstance: Object.assign(this.task, {}),
            taskTokens: parseInt(this.task.Tokens),
            redeemableTokens: 0,
            currentlyRedeeming: false,
            doneRedeeming: false
        }
    },
    computed: {
        answers() {
            return new Set(this.taskInstance.Answers.split(',')
                .map(answer => answer.trim())
                .map(answer => answer.toLowerCase()));
        },
        redeemable() {
            if (this.taskInstance.Question.trim().length == 0) {
                this.redeemableTokens = this.taskTokens;
                return true;
            }

            return this.redeemableTokens > 0;
        },
        header() {
            if (this.doneRedeeming) {
                return 'Unlocked ' + this.taskTokens + ' Attribute' + (this.taskTokens > 1 ? 's' : '');
            }

            if (this.redeemable) {
                return 'Unlock ' + this.redeemableTokens + ' Attribute' + (this.redeemableTokens > 1 ? 's' : '');
            }

            return 'Complete Task to Unlock ' + this.taskTokens + ' Attribute' + (this.taskTokens > 1 ? 's' : '');
        },
        buttonText() {
            if (this.currentlyRedeeming) {
                return 'Redeeming...'
            }

            if (this.doneRedeeming) {
                return 'Redeemed'
            }

            if (this.redeemable) {
                return 'Redeem'
            }

            return 'Complete Task ' + this.index;
        }
    },
    methods: {
        redeemToken() {
            this.currentlyRedeeming = true;
            this.setUnlockable(this);
        },
        finishRedeeming() {
            this.currentlyRedeeming = false;
            this.redeemableTokens--;

            if (this.redeemableTokens == 0)
                this.doneRedeeming = true;
        },
        startTask() {
            if (this.doneRedeeming)
                return;

            this.renderTask(this);
        },
        validateAnswer(answer) {
            if (this.answers.has(answer)) {
                this.redeemableTokens = this.taskTokens;
                return true;
            }

            return false;
        }
    },
    template: `
            <div class="ui card">
              <div class="content">
                <div class="header"> {{ header }}</div>
                <div class="description">
                  <p></p>
                </div>
              </div>
              <div id="redeemable"
                  class="ui bottom attached button"
                  v-bind:class="{ positive: redeemable && !doneRedeeming, disabled: doneRedeeming }"
                  v-on="{ click: redeemable && !doneRedeeming ? redeemToken : startTask }">
                {{ buttonText }}
              </div>
            </div>
    `
})

// tasks => render
// state of tasks
Vue.component('task-cards', {
    props: ['setUnlockable', 'renderTask'],
    data() {
        return {
            tasks: tasks
        }
    },
  template: `
          <div class="ui cards">
              <task-card
                v-for="(task, index) in tasks"
                v-bind:task="task"
                v-bind:index="index"
                v-bind:key="index"
                v-bind:setUnlockable="setUnlockable"
                v-bind:renderTask="renderTask"/>
          </div>
`
})

// products => render
// state of visibility
Vue.component('task-modal', {
  props: ['task', 'submitTask', 'closeModal', 'taskActive'],
    data() {
        return {
            answer: '',
            activeClass: 'transition visible active',
            activeDimmerStyle: {
                display: 'flex !important'
            },
            activeModalStyle: {
                display: 'block !important'
            },
            answeredCorrectly: true
        }
    },
    methods: {
        checkAnswer() {
            this.answeredCorrectly = this.task.validateAnswer(this.answer);
            if (this.answeredCorrectly) {
                this.answer = '';
                this.closeModal();
            }
        }
    },
  template: `
    <div
      v-bind:class="[taskActive ? activeClass : '']"
      v-bind:style="[taskActive ? activeDimmerStyle : '']"
      class="ui dimmer modals page">
        <div id="task-modal"
            v-bind:class="[taskActive ? activeClass : '']"
            v-bind:style="[taskActive ? activeModalStyle : '']"
            class="ui mini modal"
            >
            <i @click="closeModal" class="close icon"></i>
            <div id="modal-header" class="header">
                Task
            </div>
            <div class="content">
                <div class="description">
                    <div class="ui header">Answer the question</div>
                    <p id="modal-text">{{ task.taskInstance ? task.taskInstance.Question : '' }}</p>
                    <div v-bind:class="{ error: !answeredCorrectly }" class="ui input">
                        <input @keyup.enter="checkAnswer" type="text" placeholder="Answer" v-model="answer">
                    </div>
                </div>
                <p v-if="!answeredCorrectly">Please try again.</p>
            </div>
            <div class="actions">
                <div @click="closeModal" class="ui negative deny button">
                   Cancel 
                </div>
                <div @click="checkAnswer" id="finish-task" class="ui positive button">
                    Submit
                </div>
            </div>
        </div>
    </div>
  `
})

function init() {
  var app = new Vue({
    el: '#app',
    data: {
      unlockable: false,
      unlockedMap: {},
      redeemingTask: {},
        taskActive: false,
        openTask: {}
    },
    template: `
      <div>
        <task-modal
            v-bind:task="openTask"
            v-bind:taskActive="taskActive"
            v-bind:closeModal="closeModal"
        >
        </task-modal>
        <div class="ui stackable very relaxed grid container">
          <div class="twelve wide column">
            <product-table
              v-bind:unlockedMap="unlockedMap"
              v-bind:unlockAttribute="unlockAttribute"/>
          </div>
          <div class="four wide column">
            <task-cards
                v-bind:setUnlockable="setUnlockable"
                v-bind:renderTask="renderTask"/>
          </div>
        </div>
      </div>
    `,
    mounted: function() {
    },
    methods: {
      unlockAttribute: function(attributeName) {
        if (this.unlockable && !this.unlockedMap[attributeName]) {
          this.unlockedMap = Object.assign({[attributeName]: true}, this.unlockedMap);
          this.redeemingTask.finishRedeeming();
          this.unlockable = false;
        }
      },
      setUnlockable: function(redeemingTask) {
        this.unlockable = true;
        this.redeemingTask = redeemingTask;
      },
      closeModal: function() {
        this.openTask = {};
        this.taskActive = false;
      },
      renderTask: function(task) {
        this.openTask = task;
        this.taskActive = true;
      }
    }
  })
}

document.addEventListener("DOMContentLoaded", init);
