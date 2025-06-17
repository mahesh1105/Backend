// Normal Function
// const asyncHandler = () => {}

// Promises - The asyncHandler is attempting to be a middleware wrapper function
const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise
    .resolve(requestHandler(req, res, next))
    .catch((err) => next(err))
  }
}

// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}

// Try-Catch
// const asyncHandler = (func) => async (req, res, next) => {
//   try {
//     await func(req, res, next);
//   } catch(error) {
//     res.status(err.code || 500).json({
//         sucess: false,
//         message: err.message
//     })
//   }
// }

export { asyncHandler }

/*
  The purpose of asyncHandler is to wrap any async function (like a route handler) in a try-catch block automatically, 
  so we don’t have to write repetitive error-handling code in every route.

  🔁 Why Return a Function Instead of Just Calling It?
  - Because of how Express works. Express expects a function with the signature:
    (req, res, next) => { ... }
  
  This is your typical middleware or route handler. You don’t call these functions yourself.
  Express does it internally when handling a request.

  So when you write:
  --------------------------------------------------------
  |                                                      |
  |  app.get('/route', asyncHandler(myRouteHandler));    |
  |                                                      |
  --------------------------------------------------------
  You’re not calling myRouteHandler at that moment. 
  You’re passing a function to Express so it can call it later when someone hits /route.
  
  That means asyncHandler must return a function with (req, res, next) so Express can use it. 
  That returned function is where we do the actual try-catch.

  🔍 Let’s Contrast:
  ==================
  ❌ Bad Approach (Just calling the function):
  --------------------------------------------
  const asyncHandler = (func) => {
    try {
      func(); // this runs NOW, not when a request comes in!
    } catch (err) {
      console.error(err);
    }
  }

  This executes immediately when your server starts.
  It doesn’t provide a (req, res, next) handler.
  Express can't use this.

  ✅ Correct Approach:
  --------------------
  const asyncHandler = (func) => async (req, res, next) => {
    try {
      await func(req, res, next); // this runs when a request comes in!
    } catch (err) {
      res.status(err.code || 500).json({ success: false, message: err.message });
    }
  }

  You pass this returned function to Express.
  Express calls it when a matching request comes in.
  Your route logic (func) gets executed safely inside try-catch.

  🧠 Simple Analogy
  Think of asyncHandler like a wrapper machine:
  You feed it a "bare" async function, and it wraps it with protective try-catch and hands it to Express.

  🚀 TL;DR
  - You're returning a function because Express needs a function to call later.
  - You can’t call the route handler immediately — that defeats the purpose.
  - This pattern keeps error-handling clean, reusable, and automatic.

  Traditional way to handle the Promise:
  --------------------------------------
  const promise = new Promise((resolve, reject) => {
    if (somethingGoodHappens) {
      resolve('Yay!');
    } else {
      reject('Oops!');
    }
  });

  In the top of the file,, It’s a shortcut — instead of creating a new Promise with new Promise(...), 
  you use Promise.resolve(value) to quickly wrap any value (or result of a function) into a resolved promise.
*/