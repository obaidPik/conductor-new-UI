import {
  orkesConductorClient,
  WorkflowExecutor,
  workflow,
  waitTaskDuration,
  generateInlineTask,
  switchTask,
  terminateTask,
  httpTask,
} from "@io-orkes/conductor-javascript";

const KEY = 'fb4ca6c9-8762-44e6-ad17-98b6be97736d'
const SECRET = 'v2c1qiBaoTpsKfTBlDmBZECzCwh11WA3f1Eq3jX1swe5HOqG'
const CONDUCTOR_SERVER_URL = 'https://tmo-poc.orkesconductor.io/api'
// const SERVER_URL = 'https://tmo-poc.orkesconductor.io/api'

const createCheckoutWorkflow = () =>
  workflow("ob-checkout", [
    waitTaskDuration("confirmation_wait", "5 seconds"),
    generateInlineTask({
      name: "check_credit",
      inputParameters: {
        totalCredit: "${workflow.input.availableCredit}",
        productID: "${workflow.input.productID}",
        price: "${workflow.input.price}",
        expression: function ($) {
          return function () {
            var totaAmount = 100;
            return totaAmount >= $.price ? "hasCredit" : "noCredit";
          };
        },
      },
    }),
    switchTask("switch_has_credit", "${check_credit_ref.output.result}", {
      noCredit: [
        terminateTask(
          "termination_noCredit",
          "FAILED",
          "User has no credit to complete"
        ),
      ],
      hasCredit: [
        terminateTask(
          "termination_successfull",
          "COMPLETED",
          "User completed checkout successfully"
        ),
      ],
    }),
  ]);

export const playConfig = {
  keyId: KEY,
  keySecret: SECRET,
  serverUrl: `${CONDUCTOR_SERVER_URL}`,
};

(async () => {
  const clientPromise = orkesConductorClient(playConfig);
  const client = await clientPromise;
  const executor = new WorkflowExecutor(client);
  const wf = createCheckoutWorkflow();
  executor.registerWorkflow(true, wf);
})();