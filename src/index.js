import Vue from 'vue/dist/vue.js';

import '../semantic/components/reset.min.css';
import '../semantic/components/site.min.css';
import '../semantic/components/container.min.css';
import '../semantic/components/grid.min.css';
import '../semantic/components/input.min.css';
import '../semantic/components/label.min.css';
import '../semantic/components/table.min.css';
import '../semantic/components/icon.min.css';
import '../semantic/components/card.min.css';
import '../semantic/components/button.min.css';
import '../semantic/components/transition.min.css';
import '../semantic/components/dimmer.min.css';
import '../semantic/components/modal.min.css';

import '../semantic/components/site.min.js';
import '../semantic/components/transition.min.js';
import '../semantic/components/dimmer.min.js';
import '../semantic/components/modal.min.js';

function initQuestionMatrix(config) {

    var products = config.products;
    var tasks = config.tasks;
    var noTaskMode = config.noTaskMode;

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
        let attributeNames = Object.keys(_products[0].attributes);
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
    props: ['task', 'index', 'setUnlockable', 'renderTask', 'incrementTasksDone'],
    data() {
      return {
        taskInstance: Object.assign(this.task, {}),
        taskTokens: parseInt(this.task.Tokens),
        redeemableTokens: 0,
        currentlyRedeeming: false,
        doneRedeeming: false
      }
    },
    created() {
      if (!noTaskMode && this.taskInstance.Question.trim().length == 0)
        this.incrementTasksDone();
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

          if (noTaskMode) {
              this.incrementTasksDone();
          }
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
        <div 
            class="ui bottom attached button"
            v-bind:class="{ positive: redeemable && !doneRedeeming, disabled: doneRedeeming }"
            v-on="{ click: redeemable && !doneRedeeming ? redeemToken : startTask }">
          {{ buttonText }}
        </div>
      </div>
    `
  })

  Vue.component('task-cards', {
    props: ['setUnlockable', 'renderTask', 'numTasksDone', 'incrementTasksDone'],
    data() {
      return {
        tasks: tasks
      }
    },
    computed: {
    },
    methods: {
      showTask(task, index) {
        let hidden = task.Hidden.trim().toLowerCase() == 'yes';
        if (hidden) {
          if (this.numTasksDone >= index)
            return true

          return false;
        }

        return true;
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
            v-bind:renderTask="renderTask"
            v-bind:incrementTasksDone="incrementTasksDone"
            v-if="showTask(task, index)"
          />
      </div>`
  })

  Vue.component('task-modal', {
    props: ['task', 'closeModal', 'taskActive', 'incrementTasksDone'],
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
          let answer = this.answer.trim().toLowerCase();
          this.answeredCorrectly = this.task.validateAnswer(answer);
          if (this.answeredCorrectly) {
            this.answer = '';
            this.closeModal();
            this.incrementTasksDone();
          }
        }
      },
    template: `
      <div
        v-bind:class="[taskActive ? activeClass : '']"
        v-bind:style="[taskActive ? activeDimmerStyle : '']"
        class="ui dimmer modals page">
          <div 
            v-bind:class="[taskActive ? activeClass : '']"
            v-bind:style="[taskActive ? activeModalStyle : '']"
            class="ui mini modal">
              <i @click="closeModal" class="close icon"></i>
              <div  class="header">
                  Task
              </div>
              <div class="content">
                  <div class="description">
                      <div class="ui header">Answer the question</div>
                      <p>{{ task.taskInstance ? task.taskInstance.Question : '' }}</p>
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
                  <div @click="checkAnswer" class="ui positive button">
                      Submit
                  </div>
              </div>
          </div>
      </div>
    `
  })
  var app = new Vue({
    el: '#question-matrix-app',
    data: {
      unlockable: false,
      unlockedMap: {},
      redeemingTask: {},
      taskActive: false,
      openTask: {},
      numTasksDone: 0
    },
    template: `
      <div>
        <task-modal
            v-bind:task="openTask"
            v-bind:taskActive="taskActive"
            v-bind:closeModal="closeModal"
            v-bind:incrementTasksDone="incrementTasksDone"
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
                v-bind:renderTask="renderTask"
                v-bind:numTasksDone="numTasksDone"
                v-bind:incrementTasksDone="incrementTasksDone"
            />
          </div>
        </div>
      </div>
    `,
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
      },
      incrementTasksDone: function() {
        this.numTasksDone++;
      }
    }
  })
}

global.initQuestionMatrix = initQuestionMatrix;
window.initQuestionMatrix = initQuestionMatrix;
