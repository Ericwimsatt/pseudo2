export const reducer = (state: State, action: Action): State => {
    switch (action.type) {
case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
        };
...
    }}
=>
Export: `reducer` = Function reducer args: { state, action }
Function reducer args: { state, action }If action.type === "ADD_TOAST"
return:{
    return:...state
    return:toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
    return:}
(Too many function definitions, too many returns)