let traduction = (element)=>{
  let toreturn={type:"Literal", blocked:false, value:undefined};
  if (Array.isArray(element)) {
    toreturn = { type: "Array", blocked: false, elements: [] };
    element.forEach((val) => {
      toreturn.elements.push(traduction(val));
    });
    return toreturn;
  }
  if(typeof element === "function" && /^class\b/.test(Function.prototype.toString.call(element))){
    toreturn = {type:"Evaluation", blocked:false, properties:{}, construct:(...args)=>{
      let argGathering = args.map(arg => acornSimulator.coerce(arg).value);
      let instance = new element(...argGathering);
      return traduction(instance);
    },call:(...args)=>{
      let argGathering = args.map(arg => acornSimulator.coerce(arg).value);
      let instance = element(...argGathering);
      return traduction(instance);
    },get:()=>{
      return {type:"Literal",value:element.toString()};
    }}
    return toreturn;
  }
  
  if(element!==null){
    switch(typeof element){
      case "object":{
        let keys = Object.keys(element);
        toreturn={type:"Object", blocked:false, properties:{}};
        for (let key of keys){
          toreturn.properties[key] = traduction(element[key]);
        }
        break;
      }
      case "number":
      case "string":
      case "boolean":
        toreturn = {type:"Literal", blocked:false, value:element}
        break;
      case "function":{
        let keys = Object.getOwnPropertyNames(element);
        toreturn = {type:"Evaluation", blocked:false, properties:{},construct:(...args)=>{
          let argGathering = [];
          for(let arg of args){
            argGathering.push(acornSimulator.coerce(arg).value);
          }
          return traduction(new element(...argGathering));
        },call:(...args)=>{
          let argGathering = [];
          for(let arg of args){
            argGathering.push(acornSimulator.coerce(arg).value);
          }
          return traduction(element(...argGathering));
        },get:()=>{
          return {type:"Literal",value:element.toString()};
        }}
        for (let key of keys){
          toreturn.properties[key] = traduction(element[key]);
        }
        break;
      }
      case "undefined":
        break;
      default:
        console.log(typeof element);
        break;
    }
  }
  return toreturn;
}

let externals = [];

let acornSimulator = {
  reset: ()=>{
    acornSimulator.memory = [];
    acornSimulator.safe = true;
  },
  memory: [],
  snapshots: [],
  saveSnapshot: ()=>{
    const snapshot = structuredClone(acornSimulator.memory);
    acornSimulator.snapshots.push(snapshot);
  },
  backtrack: ()=>{
    if (acornSimulator.snapshots.length > 0) {
      acornSimulator.memory = acornSimulator.snapshots.pop();
    }else{
      acornSimulator.memory = [];
    }
  },
  safe: true,
  remember: (name)=>{
    let mem = acornSimulator.memory.find(mem => mem.name === name && !mem.TDZ);
    if(mem) {
      mem.used = true;
      return mem;
    }
    let ext = externals.find(ext => ext.name === name);
    if(ext) {
      if(ext.blocked){
        console.warn("Attempt to access blocked external");
        acornSimulator.safe = false;
      }
      return ext
    };
    dropError("","Access to undefined variable or unhandled external.");
    acornSimulator.safe = false;
    return externals.find(ext => ext.name === "undefined");
  },
  forget: (scope)=>{
    for(let mem of acornSimulator.memory.filter(mem => mem.scope === scope)){
      mem.TDZ = true;
    }
  },
  prepare: (ast)=>{
    let TDZs = []
    for(let element of ast){
      switch(element.type){
        case "FunctionDeclaration":
          break;
        case "VariableDeclaration":
          for(let declaration of element.declarations){
            let mem = acornSimulator.memory.find(mem => mem.name === declaration.id.name && !mem.TDZ);
            mem = mem ? mem: externals.find(ext => ext.name === declaration.id.name && !ext.TDZ);
            if (mem) {
              mem.TDZ=true;
              TDZs.push(mem);
            }
          }
          break;
        case "ClassDeclaration":
        case "ImportDeclaration":
        case "ExportNamedDeclaration":
        case "ExportDefaultDeclaration":
        case "ExportAllDeclaration":
        case "IfStatement":
        case "ForStatement":
        case "ForInStatement":
        case "WhileStatement":
        case "DoWhileStatement":
        case "SwitchStatement":
        case "BreakStatement":
        case "ContinueStatement":
        case "ReturnStatement":
        case "ThrowStatement":
        case "TryStatement":
        case "WithStatement":
        case "ExpressionStatement":
        case "BlockStatement":
        case "EmptyStatement":
        case "LabeledStatement":
        case "DebuggerStatement":
          break;
        default:
          console.warn(`Unhandled '${element.type}' preparation`);
          acornSimulator.safe = false;
          break;
      }
    }
    return TDZs;
  },
  simulate: (ast, scope, thisScope, others)=>{
    const _dynamic = externals.find(ext => ext.name === "_Dynamic_");
    let result = {type: "Literal", value: undefined};
    let track = {line:0}; //this is suposed to handle for _Dynamic_.possibilities();
    for(track.line in ast.body){
      let element = ast.body[track.line];
      switch(element.type){
        case "FunctionDeclaration":{
          acornSimulator.declareVariable(element.id,others?.dynamic?_dynamic.properties.any:element,undefined,"function",[],scope);
          break;
        }
        case "VariableDeclaration":{
          let kind = element.kind;
          for(let declaration of element.declarations) {
            acornSimulator.declareVariable(declaration.id,others?.dynamic?_dynamic.properties.any:declaration.init,undefined,kind,[],scope,undefined,thisScope,undefined);
          };
					break;
        }
        case "ClassDeclaration":{
          acornSimulator.declareVariable(element.id,others?.dynamic?_dynamic.properties.any:element,undefined,"class",[],scope);
          break;
        }
        case "ImportDeclaration":{
          console.warn(`Use of Import`);
          acornSimulator.safe = false;
          break;
        }
        case "ExportNamedDeclaration":{
          console.warn(`Use of export`);
          acornSimulator.safe = false;
          break;
        }
        case "ExportDefaultDeclaration":{
          console.warn(`use of export default`);
          acornSimulator.safe = false;
          break;
        }
        case "ExportAllDeclaration":{
          console.warn(`Use of export *`);
          acornSimulator.safe = false;
          break;
        }
        case "IfStatement":{
          let test = acornSimulator.coerce(acornSimulator.resolve(element.test,undefined,[],scope,thisScope,thisScope));
          if(test.value === _dynamic.properties.any.value){
            acornSimulator.simulate({body:[element.consequent]},scope,thisScope,{dynamic:true});
            if(element.alternate) acornSimulator.simulate({body:[element.alternate]},scope,thisScope,{dynamic:true});
            
            return _dynamic.properties.any;
          }
          let r
          if(test.value){
            r = acornSimulator.simulate({body:[element.consequent]},scope,thisScope,others);
          }else if(element.alternate){
            r = acornSimulator.simulate({body:[element.alternate]},scope,thisScope,others);
          }else{
            r = {type: "Literal", value: undefined};
          }
          if(["BreakSignal","ReturnSignal","ContinueSignal"].includes(r.type)) return r;
					break;
        }
        case "ForStatement":{
          let TDZs = [];
          if(element.init){
            if(element.init.type === "VariableDeclaration"){
              TDZs = acornSimulator.prepare([element.init]);
              acornSimulator.simulate({body:[element.init]},scope+"/forLoopInit",thisScope,others);
            }else{
              acornSimulator.resolve(element.init,undefined,[],scope+"/forLoopInit",thisScope,thisScope);
            }
          }
          
          const stackLimit = 10000;
          let stackCount = 0;
          {
            let n = acornSimulator.prepare(element.body.body);
            TDZs.push(...n);
          }
          
          while(stackCount < stackLimit){
            let test = acornSimulator.coerce(acornSimulator.resolve(element.test,undefined,[],scope,thisScope,thisScope));
            if(test.value || test.value===undefined){
              let sim = acornSimulator.simulate(element.body, scope+"/forLoopBody", thisScope, others);
              if(sim.type==="BreakSignal") break;
              if(sim.type==="ReturnSignal") return sim;
							acornSimulator.resolve(element.update,undefined,[],scope+"/forLoopBody", thisScope, thisScope);
            }else{
              break;
            }
            acornSimulator.prepare(element.body.body);
            stackCount++;
          }
          
          acornSimulator.forget(scope+"/forLoopBody");
            
          for(let tdz of TDZs){
            tdz.TDZ = false;
          }
          
          if(stackCount >= stackLimit){
            console.warn(`loop Stack Overflow`);
            acornSimulator.safe = false;
          }
          break;
        }
        case "ForInStatement":{
          let right = acornSimulator.resolve(element.right,undefined,[],scope,thisScope,thisScope);
          let indexer;
          let i=0;
          let TDZs = [];
          if(element.left.type === "VariableDeclaration"){
            TDZs = acornSimulator.prepare([element.left]);
            acornSimulator.simulate({body:[element.left]},scope+"/forInLoopLeft");
            indexer = acornSimulator.remember(element.left.declarations[0].id.name);
          }else{
            indexer = acornSimulator.resolve(element.left,undefined,[],scope+"/forInLoopLeft",thisScope,thisScope);
          }
          indexer.value = right.properties?Object.keys(right.properties)[i]:i;
          
          const stackLimit = 10000;
          let stackCount = 0;
          {
            let n = acornSimulator.prepare(element.body.body);
            TDZs.push(...n);
          }
          
          while(stackCount < stackLimit){
            let test = i < (right.elements?right.elements.length:right.properties?Object.keys(right.properties).length:right.value.length);
            if(test){
              let sim = acornSimulator.simulate(element.body, scope+"/forLoopBody", thisScope);
              if(sim.type==="BreakSignal") break;
              if(sim.type==="ReturnSignal") return sim;
              i++;
              indexer.value =right.properties?Object.keys(right.properties)[i]:i;
            }else{
              break;
            }
            acornSimulator.prepare(element.body.body);
            stackCount++;
          }
          
          acornSimulator.forget(scope+"/forLoopBody");
            
          for(let tdz of TDZs){
            tdz.TDZ = false;
          }
          
          if(stackCount >= stackLimit){
            console.warn(`loop Stack Overflow`);
            acornSimulator.safe = false;
          }
          break;
        }
        /*sort of*/case "ForOfStatement":{
          let right = acornSimulator.resolve(element.right);
          let indexer;
          let i=0;
          let TDZs = [];
          if(element.left.type === "VariableDeclaration"){
            TDZs = acornSimulator.prepare([element.left]);
            acornSimulator.simulate({body:[element.left]},scope+"/forOFLoopLeft");
            indexer = acornSimulator.remember(element.left.declarations[0].id.name);
          }else{
            indexer = acornSimulator.resolve(element.left,undefined,[],scope+"/forOFLoopLeft",thisScope,thisScope);
          }
          indexer.value = right.properties?right.properties[Object.keys(right.properties)[i]]:right.elements?right.elements[i]:right.value[i];
          
          const stackLimit = 10000;
          let stackCount = 0;
          {
            let n = acornSimulator.prepare(element.body.body);
            TDZs.push(...n);
          }
          
          while(stackCount < stackLimit){
            let test = i < (right.elements?right.elements.length:right.properties?Object.keys(right.properties).length:right.value.length);
            if(test){
              let sim = acornSimulator.simulate(element.body, scope+"/forLoopBody", thisScope);
              if(sim.type==="BreakSignal") break;
              if(sim.type==="ReturnSignal") return sim;
              i++;
              indexer.value = right.properties?right.properties[Object.keys(right.properties)[i]]:right.elements?right.elements[i]:right.value[i];;
            }else{
              break;
            }
            acornSimulator.prepare(element.body.body);
            stackCount++;
          }
          
          acornSimulator.forget(scope+"/forLoopBody");
            
          for(let tdz of TDZs){
            tdz.TDZ = false;
          }
          
          if(stackCount >= stackLimit){
            console.warn(`loop Stack Overflow`);
            acornSimulator.safe = false;
          }
          break;
        }
        case "WhileStatement":{
          const stackLimit = 10000;
          let stackCount = 0;
          let TDZs = acornSimulator.prepare(element.body.body);

          while(stackCount < stackLimit){
            let test = acornSimulator.coerce(acornSimulator.resolve(element.test, undefined, [], scope, thisScope, thisScope));
            if(test.value || test.value === undefined){
              let sim = acornSimulator.simulate(element.body, scope+"/whileBody", thisScope);
              if(sim.type === "BreakSignal") break;
              if(sim.type === "ReturnSignal") return sim;
            } else break;
            stackCount++;
          }

          acornSimulator.forget(scope+"/whileBody");
          for(let tdz of TDZs) tdz.TDZ = false;

          if(stackCount >= stackLimit){
            console.warn(`loop Stack Overflow`);
            acornSimulator.safe = false;
          }
          break;
        }
        case "DoWhileStatement":{
          const stackLimit = 10000;
          let stackCount = 0;
          let TDZs = acornSimulator.prepare(element.body.body);

          let test = true;
          while(stackCount < stackLimit){
            if(test.value || test.value === undefined){
              let sim = acornSimulator.simulate(element.body, scope+"/whileBody", thisScope);
              if(sim.type === "BreakSignal") break;
              if(sim.type === "ReturnSignal") return sim;
            } else break;
            test = acornSimulator.coerce(acornSimulator.resolve(element.test, undefined, [], scope, thisScope, thisScope));
            stackCount++;
          }

          acornSimulator.forget(scope+"/whileBody");
          for(let tdz of TDZs) tdz.TDZ = false;

          if(stackCount >= stackLimit){
            console.warn(`loop Stack Overflow`);
            acornSimulator.safe = false;
          }
          break;
        }
        case "SwitchStatement":{
          if(element.discriminant.value === _dynamic.properties.any.value){
            
            for(let i = 0; i<element.cases.length;i++){
              acornSimulator.simulate({body:[...element.cases[i].consequent]},scope,thisScope,{dynamic:true});
            }
            
            return _dynamic.properties.any;
          }
          
          let caseID=0;
          while(caseID<element.cases.length){
            let test = acornSimulator.coerce(acornSimulator.resolve({type:"BinaryExpression", operator:"===", left:element.discriminant, right:element.cases[caseID].test},undefined,[],scope,thisScope,thisScope));
            let r
            if(test.value){
              while(caseID<element.cases.length){
                r = acornSimulator.simulate({body:[...element.cases[caseID].consequent]},scope,thisScope);
                if(["BreakSignal","ReturnSignal","ContinueSignal"].includes(r.type)) return ["ReturnSignal","ContinueSignal"].includes(r.type)?r:undefined;
                caseID++;
              }
            }else{
              caseID++;
            }
          }
          break;
        }
        case "BreakStatement":{
          if(element.label) {
            console.warn(`Unhandled '${element.type}' simulation by use of label`);
            acornSimulator.safe = false;
          }
          return { type: "BreakSignal" };
        }
        case "ContinueStatement":{
          if(element.label) {
            console.warn(`Unhandled '${element.type}' simulation by use of label`);
            acornSimulator.safe = false;
          }
          return { type: "ContinueSignal" };
        }
        case "ReturnStatement":{
          let r = acornSimulator.resolve(element.argument,undefined,[],scope, thisScope,thisScope);
          
          return { type: "ReturnSignal", return: r };
        }
        case "ThrowStatement":{
          let r = acornSimulator.resolve(element.argument,undefined,[],scope,undefined,thisScope,others);
          return { type: "ErrorSignal", message: r};
        }
        case "TryStatement":{
          let TDZs = [];
          // Prepare TDZs for catch param if it exists
          if(element.handler?.param) {
            TDZs.push(...acornSimulator.prepare([{type:"VariableDeclaration", declarations:[{id: element.handler.param, init:null}], kind:"let"}]));
          }

          let signal;

          signal = acornSimulator.simulate(element.block, scope+"/tryBlock", thisScope);
          if(signal?.type === "ErrorSignal" && element.handler) {
            acornSimulator.declareVariable(element.handler.param,signal.message,undefined,"init",[],scope+"/catch");

            const catchSignal = acornSimulator.simulate(element.handler.body, scope+"/catchBody", thisScope);
            if(catchSignal) signal = catchSignal;
          }
          
          if(element.finalizer) {
              const finallySignal = acornSimulator.simulate(element.finalizer, scope+"/finallyBlock", thisScope);
              if(finallySignal) signal = finallySignal;
          }

          for(let tdz of TDZs) tdz.TDZ = false;

          return signal;
        }
        case "WithStatement":{
          console.warn(`Use of With`);
          acornSimulator.safe = false;
          break;
        }
        case "ExpressionStatement":{
          result = acornSimulator.resolve(element.expression,undefined,[],scope,thisScope,thisScope,others);
          break;
        }
        case "BlockStatement":{
          let TDZs = acornSimulator.prepare(element.body);
          let result = acornSimulator.simulate(element,scope+"/block",thisScope,others);

          acornSimulator.forget(scope+"/block");

          for(let tdz of TDZs){
            tdz.TDZ = false;
          }
          
          return result;
        }
        case "EmptyStatement":{
          break;
        }
        /**/case "LabeledStatement":{
          console.warn(`Unhandled '${element.type}' simulation`);
          acornSimulator.safe = false;
          break;
        }
        /**/case "DebuggerStatement":{
          console.warn(`Unhandled '${element.type}' simulation`);
          acornSimulator.safe = false;
          break;
        }
        default:
          console.warn(`Unhandled '${element.type}' simulation`);
          acornSimulator.safe = false;
          break;
      }
    }
    return result;
  },
  declareVariable: (id,init,def,kind,indexing,scope,selfScope,thisScope,excludedKeys)=>{
    switch(id.type){
      case "Identifier":
        {
          let variable = {
            kind,
            name: id.name,
            TDZ: false,
            used: false,
            scope
          };
          if(init === null){
            variable.type = "Literal";
            variable.value = undefined;
            variable.blocked = false;
            variable.prototype = new Object();
            acornSimulator.memory.push(variable);
            break;
          }
          let resolution = init.type === "MemberExpression" ? acornSimulator.resolve(init,def,indexing,scope,selfScope,thisScope).child : acornSimulator.resolve(init,def,indexing,scope,selfScope,thisScope);
          variable.type = resolution.type;
          variable.blocked = false;
          variable.prototype = resolution.prototype;
          let skip = false;
          switch(resolution.type){
            case "Literal":
              variable.value = resolution.value;
              break;
            case "Array":
              variable.elements = resolution.elements;
              variable.properties = resolution.properties;
              break;
            case "Object":
              variable.properties = resolution.properties;
              break;
            case "Function":
              variable.id = resolution.id;
              variable.params = resolution.params;
              variable.body = resolution.body;
              variable.properties = resolution.properties;
              break;
            case "ReturnSignal":
              acornSimulator.declareVariable(id,resolution.return,def,kind,indexing,scope,selfScope,thisScope,excludedKeys);
              skip = true;
              break;
            case "ArrowFunction":
              variable.id = resolution.id;
              variable.params = resolution.params;
              variable.body = resolution.body;
              variable.properties = resolution.properties;
              break;
            case "Class":
              variable.id = resolution.id;
              variable.super = resolution.super;
              variable.body = resolution.body;
              variable.properties = resolution.properties;
              break;
            case "Evaluation":
              acornSimulator.declareVariable(id,resolution.get(),def,kind,indexing,scope,selfScope,thisScope,excludedKeys);
              skip = true;
              break;
            case "Accessor":
              acornSimulator.declareVariable(id,resolution.get(),def,kind,indexing,scope,selfScope,thisScope,excludedKeys);
              skip = true;
              break;
            default:
              console.warn(`Unhandled '${resolution.type}' resolution declaration`);
              acornSimulator.safe = false;
              break;
          }
          if(!skip) acornSimulator.memory.push(variable);
          break;
        }
      case "ArrayPattern":
        {
          let excludedKeys = [];
          for(let index in id.elements){
            let element = id.elements[index].value;
            if(indexing){
              acornSimulator.declareVariable(id.elements[index],init,undefined,kind,[...indexing,id.elements[index].type === "RestElement" ? "a"+index : index],scope,selfScope,thisScope,id.elements[index].type === "RestElement" ? excludedKeys : undefined);
            }else{
              acornSimulator.declareVariable(id.elements[index],init,undefined,kind,[id.elements[index].type === "RestElement" ? "a"+index : index],scope,selfScope,thisScope);
            }
          }
          break;
        }
      case "ObjectPattern":
        {
          let excludedKeys = [];
          for(let index in id.properties){
            let element = id.properties[index].value;
            if(indexing){
              if(id.properties[index].type === "Property"){
                excludedKeys.push(id.properties[index].key.name);
                acornSimulator.declareVariable(id.properties[index].value,init,undefined,kind,[...indexing,id.properties[index].key.name],scope,selfScope,thisScope);
              }else if(id.properties[index].type === "RestElement"){
                acornSimulator.declareVariable(id.properties[index],init,undefined,kind,[...indexing,undefined],scope,selfScope,thisScope,excludedKeys);
              }
            }else{
              //switch/case if it hit a third.
              if(id.properties[index].type === "Property"){
                excludedKeys.push(id.properties[index].key.name);
                acornSimulator.declareVariable(id.properties[index].value,init,undefined,kind,[id.properties[index].key.name],scope,selfScope,thisScope);
              }else if(id.properties[index].type === "RestElement"){
                acornSimulator.declareVariable(id.properties[index],init,undefined,kind,[undefined],scope,selfScope,thisScope,excludedKeys);
              }
            }
          }
          break;
        }
      case "AssignmentPattern":
        {
          acornSimulator.declareVariable(id.left,init,id.right,kind,[...indexing],scope,selfScope,thisScope);
          break;
        }
      case "RestElement":
        {
          //Switch/case if we hit a third.
          if(init.type === "ArrayExpression"){
            let variable = {
              kind,
              name: id.argument.name,
              TDZ: false,
              used: false,
              scope
            };
            let elements = [];
            if(indexing&&indexing.length>0&&indexing[0][0] !== "a"[0]){
              let newIndexing = [...indexing];
              newIndexing.splice(0,1);
              acornSimulator.declareVariable(id,init.elements[indexing[0]],def,kind,newIndexing,scope,selfScope,thisScope,excludedKeys);
              break;
            }
            for(let i=indexing[0].split("a")[1];i<init.elements.length;i++){
              elements.push(acornSimulator.resolve(init.elements[i],def,[],scope,selfScope,thisScope))
            }
            variable.type = "Array";
            variable.elements = elements;
            acornSimulator.memory.push(variable);
          }
          if(init.type === "ObjectExpression"){
            let variable = {
              kind,
              name: id.argument.name,
              TDZ: false,
              used: false,
              scope
            };
            let properties = {};
            if(indexing&&indexing.length>0&&indexing[0] !== undefined){
              let newIndexing = [...indexing];
              newIndexing.splice(0,1);
              acornSimulator.declareVariable(id,init.properties.find(prop => prop.key.name === indexing[0]).value,def,kind,newIndexing,scope,selfScope,thisScope,excludedKeys);
              break;
            }
            for(let prop of init.properties){
              if(!excludedKeys.includes(prop.key.name)){
                let resolution = acornSimulator.resolve(prop.value,def,indexing,scope,selfScope,thisScope);
                properties[prop.key.name]=resolution;
              }
            }
            variable.type = "Array";
            variable.properties = properties;
            acornSimulator.memory.push(variable);
          }
        }
        break;
      default:
        console.warn(`Unhandled '${id.type}' declaration`);
        acornSimulator.safe = false;
        break;
    }
  },
  assignVariable: (id,init,def,indexing,scope,selfScope,thisScope,excludedKeys)=>{
    switch(id.type){
      case "Identifier":
        {
          let tarjet = acornSimulator.remember(id.name);
          if(tarjet.name !== id.name){
            break;
          }
          let resolution = acornSimulator.resolve(init,def,indexing,scope,selfScope,thisScope);
          resolution = resolution.child?resolution.child:resolution;
          tarjet.type = resolution.type;
          switch(resolution.type){
            case "Literal":
              tarjet.value = resolution.value;
              tarjet.elements = undefined;
              tarjet.properties = undefined;
              tarjet.id = undefined;
              tarjet.params = undefined;
              tarjet.body = undefined;
              tarjet.super = undefined;
              break;
            case "Array":
              tarjet.value = undefined;
              tarjet.elements = resolution.elements;
              tarjet.properties = resolution.properties;
              tarjet.id = undefined;
              tarjet.params = undefined;
              tarjet.body = undefined;
              tarjet.super = undefined;
              break;
            case "Object":
              tarjet.value = undefined;
              tarjet.elements = undefined;
              tarjet.properties = resolution.properties;
              tarjet.id = undefined;
              tarjet.params = undefined;
              tarjet.body = undefined;
              tarjet.super = undefined;
              break;
            case "Function":
              tarjet.value = undefined;
              tarjet.elements = undefined;
              tarjet.properties = resolution.properties;
              tarjet.id = resolution.id;
              tarjet.params = resolution.params;
              tarjet.body = resolution.body;
              tarjet.super = undefined;
              break;
            case "ReturnSignal":
              acornSimulator.resolveVariable(id,resolution.return,def,indexing,scope,selfScope,thisScope,excludedKeys);
              skip = true;
              break;
            case "ArrowFunction":
              tarjet.value = undefined;
              tarjet.elements = undefined;
              tarjet.properties = resolution.properties;
              tarjet.id = resolution.id;
              tarjet.params = resolution.params;
              tarjet.body = resolution.body;
              tarjet.super = undefined;
              break;
            case "Class":
              tarjet.value = undefined;
              tarjet.elements = undefined;
              tarjet.properties = resolution.properties;
              tarjet.id = resolution.id;
              tarjet.params = undefined;
              tarjet.body = resolution.body;
              tarjet.super = resolution.super;
              break;
            default:
              console.warn(`Unhandled '${resolution.type}' resolution declaration`);
              acornSimulator.safe = false;
              break;
          }
          return tarjet;
        }
      case "ArrayPattern":
        {
          let excludedKeys = [];
          for(let index in id.elements){
            let element = id.elements[index].value;
            if(indexing){
              acornSimulator.assignVariable(id.elements[index],init,undefined,[...indexing,id.elements[index].type === "RestElement" ? "a"+index : index],scope,selfScope,thisScope,id.elements[index].type === "RestElement" ? excludedKeys : undefined);
            }else{
              acornSimulator.assignVariable(id.elements[index],init,undefined,[id.elements[index].type === "RestElement" ? "a"+index : index],scope,selfScope,thisScope);
            }
          }
          break;
        }
      case "ObjectPattern":
        {
          let excludedKeys = [];
          for(let index in id.properties){
            let element = id.properties[index].value;
            if(indexing){
              if(id.properties[index].type === "Property"){
                excludedKeys.push(id.properties[index].key.name);
                acornSimulator.assignVariable(id.properties[index].value,init,undefined,[...indexing,id.properties[index].key.name],scope,selfScope,thisScope);
              }else if(id.properties[index].type === "RestElement"){
                acornSimulator.assignVariable(id.properties[index],init,undefined,[...indexing,undefined],scope,selfScope,thisScope,excludedKeys);
              }
            }else{
              //switch/case if it hit a third.
              if(id.properties[index].type === "Property"){
                excludedKeys.push(id.properties[index].key.name);
                acornSimulator.assignVariable(id.properties[index].value,init,undefined,[id.properties[index].key.name],scope,selfScope,thisScope);
              }else if(id.properties[index].type === "RestElement"){
                acornSimulator.assignVariable(id.properties[index],init,undefined,[undefined],scope,selfScope,thisScope,excludedKeys);
              }
            }
          }
          break;
        }
      case "AssignmentPattern":
        {
          acornSimulator.assignVariable(id.left,init,id.right,[...indexing],scope,selfScope,thisScope);
          break;
        }
      case "RestElement":
        {
          //Switch/case if we hit a third.
          if(init.type === "ArrayExpression"){
            let tarjet = acornSimulator.remember(id.argument.name);
            let elements = [];
            if(indexing&&indexing.length>0&&indexing[0][0] !== "a"[0]){
              let newIndexing = [...indexing];
              newIndexing.splice(0,1);
              acornSimulator.assignVariable(id,init.elements[indexing[0]],def,newIndexing,scope,selfScope,thisScope,excludedKeys);
              break;
            }
            for(let i=indexing[0].split("a")[1];i<init.elements.length;i++){
              elements.push(acornSimulator.resolve(init.elements[i],def,[],scope,selfScope,thisScope))
            }
            tarjet.type = "Array";
            tarjet.value = undefined;
            tarjet.elements = elements;
            tarjet.properties = undefined;
            tarjet.id = undefined;
            tarjet.params = undefined;
            tarjet.body = undefined;
            return tarjet;
          }
          if(init.type === "ObjectExpression"){
            let tarjet = acornSimulator.remember(id.argument.name);
            let properties = {};
            if(indexing&&indexing.length>0&&indexing[0] !== undefined){
              let newIndexing = [...indexing];
              newIndexing.splice(0,1);
              acornSimulator.assignVariable(id,init.properties.find(prop => prop.key.name === indexing[0]).value,def,newIndexing,scope,selfScope,thisScope,excludedKeys);
              break;
            }
            for(let prop of init.properties){
              if(!excludedKeys.includes(prop.key.name)){
                let resolution = acornSimulator.resolve(prop.value,def,indexing,scope,selfScope,thisScope);
                properties[prop.key.name]=resolution;
              }
            }
            tarjet.type = "Array";
            tarjet.value = undefined;
            tarjet.elements = undefined;
            tarjet.properties = properties;
            tarjet.id = undefined;
            tarjet.params = undefined;
            tarjet.body = undefined;
            return tarjet;
          }
          return {};
        }
      case "MemberExpression":
        {
          let kinda = acornSimulator.resolve(id,def,indexing,scope,selfScope,thisScope);
          let property = id.computed ? acornSimulator.resolve(id.property,def,indexing,scope,selfScope,thisScope).value : id.property.name
          let object;
          if(kinda.child){
            object = acornSimulator.resolve(kinda.parent,undefined,[],scope,selfScope,thisScope);
            tarjet = acornSimulator.resolve(object).properties?.[property];
          }else{
            object = kinda.parent;
            tarjet = object.properties?.[property];
          }
          
          if(!tarjet){
            object.properties[property] = {};
            tarjet = object.properties[property];
            tarjet.blocked = false;
          }
          
          let resolution = acornSimulator.resolve(init,def,indexing,scope,object,thisScope);
          
          tarjet.type = resolution.type;
          switch(resolution.type){
            case "Literal":
              tarjet.value = resolution.value;
              tarjet.elements = undefined;
              tarjet.properties = undefined;
              tarjet.id = undefined;
              tarjet.params = undefined;
              tarjet.body = undefined;
              break;
            case "Array":
              tarjet.value = undefined;
              tarjet.elements = resolution.elements;
              tarjet.properties = undefined;
              tarjet.id = undefined;
              tarjet.params = undefined;
              tarjet.body = undefined;
              break;
            case "Object":
              tarjet.value = undefined;
              tarjet.elements = undefined;
              tarjet.properties = resolution.properties;
              tarjet.id = undefined;
              tarjet.params = undefined;
              tarjet.body = undefined;
              break;
            case "Function":
              tarjet.value = undefined;
              tarjet.elements = undefined;
              tarjet.properties = undefined;
              tarjet.id = resolution.id;
              tarjet.params = resolution.params;
              tarjet.body = resolution.body;
              break;
            case "ReturnSignal":
              acornSimulator.assignVariable(id,resolution.return,def,indexing,scope,object,thisScope,excludedKeys);
              skip = true;
              break;
            /**/case "ArrowFunction":
              console.warn(`Unhandled '${resolution.type}' resolution declaration`);
              acornSimulator.safe = false;
              break;
            /**/case "Class":
              console.warn(`Unhandled '${resolution.type}' resolution declaration`);
              acornSimulator.safe = false;
              break;
            default:
              console.warn(`Unhandled '${resolution.type}' resolution declaration`);
              acornSimulator.safe = false;
              break;
          }
          return tarjet;
        }
      default:
        console.warn(`Unhandled '${id.type}' assignation`);
        acornSimulator.safe = false;
        break;
    }
  },
  resolve: (ast,def,indexing,scope,selfScope,thisScope,others)=>{
    const _dynamic = externals.find(ext => ext.name === "_Dynamic_");
    if(others?.dynamic){
      return _dynamic.properties.any
    }
    if(ast) {
      switch(ast.type){
        case "ThisExpression":{
          return thisScope ? thisScope : acornSimulator.remember("window");
        }
        case "Identifier":{
            let mem = acornSimulator.remember(ast.name);
            switch(mem.type){
              case "Literal":
                return {type: mem.type, blocked: false, prototype: mem.prototype, value: mem.value === undefined ? def ? def.value : undefined : mem.value};
              case "Array":
                return {type: mem.type, blocked: false, prototype: mem.prototype, elements: mem.elements};
              case "Object":
                return {type: mem.type, blocked: false, prototype: mem.prototype, properties: mem.properties};
              case "Function":
                return {type: mem.type, blocked: false, prototype: mem.prototype, id: mem.id, params: mem.params, body: mem.body};
              case "ArrowFunction":
                return {type: mem.type, blocked: false, prototype: mem.prototype, id: mem.id, params: mem.params, body: mem.body};
              /**/case "Class":
                return {type: mem.type, blocked: false, prototype: mem.prototype, id: mem.id, super: mem.super, body: mem.body};
              case "Evaluation":
                return {type: mem.type, blocked: false, prototype: mem.prototype, construct:mem.construct, call:mem.call, get:mem.get};
              default:
                console.warn(`Unhandled '${mem.type}' identification`);
                acornSimulator.safe = false;
                break;
            }
          }
        case "Literal":{
            let value = 
              indexing&&indexing.length>0 ?
                indexing[0] === undefined ?
                  ast.value
                :
                  typeof ast.value[Symbol.iterator] === 'function' ?
                    ast.value[indexing[0]]
                  :
                    (()=>{
                      console.error("not iterable");
                      acornSimulator.safe = false;
                      return undefined
                    })()
              :
                ast.value;
            return {type:"Literal",blocked:false,value: value === undefined ? def ? def.value : undefined : value};
          }
        case "TemplateLiteral":{
          let value = ``;
          for(let q in ast.quasis){
            let quack = ast.quasis[q];
            value += quack.value.cooked;
            if(!quack.tail) value += acornSimulator.resolve(ast.expressions[q],def,indexing,scope,selfScope,thisScope).value;
          }
          return {type:"Literal", blocked: false,value: value};
        }
        case "ArrayExpression":{
            if(indexing&&indexing.length>0){
              let newIndexing = [...indexing];
              newIndexing.splice(0,1);
              let r = ast.elements[indexing[0]];
              return acornSimulator.resolve(r ? r : def, def ,newIndexing,scope, selfScope, thisScope);
            }else{
              let elements = [];
              for(let element of ast.elements){
                elements.push(acornSimulator.resolve(element,undefined,[],scope, selfScope, thisScope));
              }
              return {type:"Array", blocked: false, elements:elements === undefined ? def ? def.value : undefined : elements, properties:{}};
            }
          }
        case "ObjectExpression":{
          if(indexing&&indexing.length>0){
            let newIndexing = [...indexing];
            newIndexing.splice(0,1);
            let r = ast.properties.find(p => p.key.name === indexing[0])
            return acornSimulator.resolve(r ? r.value : def, def ,newIndexing,scope, selfScope, thisScope);
          }else{
            let properties = {};
            for(let property of ast.properties){
              let key=property.computed? acornSimulator.coerce(acornSimulator.resolve(property.key,undefined,[],scope, selfScope, thisScope)).value : property.key.name;
              properties[key]=acornSimulator.resolve(property.value,def,[],scope, selfScope, thisScope);
            }
            return {type:"Object", blocked: false, prototype:{}, properties:properties === undefined ? def ? def.value : undefined : properties};
          }
        }
        case "FunctionExpression":
        case "FunctionDeclaration":{
            if(!ast.expression&&!ast.generator&&!ast.async){
              return {type:"Function", blocked: false, properties:{}, id:ast.id, params:ast.params, body:ast.body.body};
            }else{
              console.warn(`Unhandled '${ast.type}' resolution (by expression:${ast.expression}, generator:${ast.generator}, async:${ast.async})`);
              acornSimulator.safe = false;
            }
            break;
          }
        case "ArrowFunctionExpression":{ 
            if(!ast.expression&&!ast.generator&&!ast.async){
              return {type:"ArrowFunction", blocked: false, properties:{}, id:ast.id, params:ast.params, body:ast.body.body};
            }else{
              console.warn(`Unhandled '${ast.type}' resolution (by expression:${ast.expression}, generator:${ast.generator}, async:${ast.async})`);
              acornSimulator.safe = false;
            }
            break;
          }
        case "ClassExpression":
        case "ClassDeclaration":{
          return {type:"Class", blocked: false, prototype:new Object(), properties:{}, id:ast.id, super:acornSimulator.resolve(ast.superClass,def,[],scope,selfScope,thisScope), body:ast.body.body};
        }
        /**/case "MetaProperty":{
          console.warn(`Unhandled '${ast.type}' resolution`);
          acornSimulator.safe = false;
          break;
        }
        case "UnaryExpression":{
          switch(ast.operator){
            case "+":
              {
                let resolution = ast.argument.type === "MemberExpression" ? acornSimulator.resolve(ast.argument,undefined,[],scope,selfScope,thisScope).child : acornSimulator.resolve(ast.argument,undefined,[],scope,selfScope,thisScope);
                let coertion = acornSimulator.coerce(resolution);
                if(coertion.value===_dynamic.properties.any.value){
                  return _dynamic.properties.any;
                }else if(coertion.value.possibilities){
                  let values = [];
                  for(let val of coertion.value.possibilities){
                    values.push({type: "Literal", blocked: false, value: +acornSimulator.coerce(val).value});
                  }
                  return _dynamic.properties.possibilities.run(...values);
                }
                return {type: "Literal", blocked: false, value: +coertion.value};
              }
            case "-":
              {
                let resolution = ast.argument.type === "MemberExpression" ? acornSimulator.resolve(ast.argument,undefined,[],scope,selfScope,thisScope).child : acornSimulator.resolve(ast.argument,undefined,[],scope,selfScope,thisScope);
                let coertion = acornSimulator.coerce(resolution);
                if(coertion.value===_dynamic.properties.any.value){
                  return _dynamic.properties.any;
                }else if(coertion.value.possibilities){
                  let values = [];
                  for(let val of coertion.value.possibilities){
                    values.push({type: "Literal", blocked: false, value: -acornSimulator.coerce(val).value});
                  }
                  return _dynamic.properties.possibilities.run(...values);
                }
                return {type: "Literal", blocked: false, value: -coertion.value};
              }
            case "!":
              {
                let resolution = ast.argument.type === "MemberExpression" ? acornSimulator.resolve(ast.argument,undefined,[],scope,selfScope,thisScope).child : acornSimulator.resolve(ast.argument,undefined,[],scope,selfScope,thisScope);
                let coertion = acornSimulator.coerce(resolution);
                if(coertion.value===_dynamic.properties.any.value){
                  return _dynamic.properties.any;
                }else if(coertion.value.possibilities){
                  let values = [];
                  for(let val of coertion.value.possibilities){
                    values.push({type: "Literal", blocked: false, value: !acornSimulator.coerce(val).value});
                  }
                  return _dynamic.properties.possibilities.run(...values);
                }
                return {type: "Literal", blocked: false, value: !coertion.value};
              }
            case "~":
              {
                let resolution = ast.argument.type === "MemberExpression" ? acornSimulator.resolve(ast.argument,undefined,[],scope,selfScope,thisScope).child : acornSimulator.resolve(ast.argument,undefined,[],scope,selfScope,thisScope);
                let coertion = acornSimulator.coerce(resolution);
                if(coertion.value===_dynamic.properties.any.value){
                  return _dynamic.properties.any;
                }else if(coertion.value.possibilities){
                  let values = [];
                  for(let val of coertion.value.possibilities){
                    values.push({type: "Literal", blocked: false, value: ~acornSimulator.coerce(val).value});
                  }
                  return _dynamic.properties.possibilities.run(...values);
                }
                return {type: resolution.type, blocked: false, value: ~coertion.value};
              }
            case "typeof":
              {
                let resolution = ast.argument.type === "MemberExpression" ? acornSimulator.resolve(ast.argument,undefined,[],scope,selfScope,thisScope).child : acornSimulator.resolve(ast.argument,undefined,[],scope,selfScope,thisScope);
                switch(resolution.type) {
                  case "Literal":
                    if(resolution.value===_dynamic.properties.any.value){
                      return _dynamic.properties.any;
                    }else if(resolution.value.possibilities){
                      let values = [];
                      for(let val of resolution.value.possibilities){
                        let va = {...val}
                        switch(val.type){
                          case "Object":
                            va.type = "ObjectExpression";
                            va.properties = [];
                            break;
                          case "Array":
                            va.type = "ArrayExpression";
                            break;
                          case "ArrowFunction":
                            va.type = "ArrowFunctionExpression";
                            break;
                          case "Function":
                            va.type = "FunctionExpression";
                            break;
                          case "Class":
                            va.type = "ClassExpression";
                            break;
                        }
                        values.push(acornSimulator.resolve({type:"UnaryExpression",operator:"typeof",argument:va},def,indexing,scope,selfScope,thisScope));
                      }
                      return _dynamic.properties.possibilities.run(...values);
                    }
                    return { type: "Literal", blocked: false, value: typeof resolution.value };
                  case "Array":
                  case "Object":
                    return { type: "Literal", blocked: false, value: "object" };  // arrays are objects in JS
                  case "ArrowFunction":
                  case "Function":
                  case "Class":
                    return { type: "Literal", blocked: false, value: "function" }; // classes typeof === "function"
                  default:
                    return { type: "Literal", blocked: false, value: "undefined" }; // fallback
                }
              }
            case "void":
              {
                acornSimulator.resolve(ast.argument,undefined,[],scope,selfScope,thisScope);
                return {type: "Literal", blocked: false, value: undefined};
              }
            case "delete":
              {
                if(ast.argument.type === "MemberExpression"){
                  let object = ast.argument.object.type === "MemberExpression" ? ast.argument.type === "MemberExpression" ? acornSimulator.resolve(ast.argument.object,undefined,[],scope,selfScope,thisScope).child : acornSimulator.resolve(ast.argument.object,undefined,[],scope,selfScope,thisScope) : acornSimulator.remember(ast.argument.object.name);
                  if(object===_dynamic){
                    console.warn(`Attempt to delete dynamicly`);
                    acornSimulator.safe = false;
                    return { type: "Literal", blocked: false, value: true };
                  };
                  let propertyName = ast.argument.computed ? ast.argument.type === "MemberExpression" ? acornSimulator.resolve(ast.argument.property,undefined,[],scope,selfScope,thisScope).child.value : acornSimulator.resolve(ast.argument.property,undefined,[],scope,selfScope,thisScope).value : ast.argument.property.name;
                  if(object){
                    switch(object.type){
                      case "Object":
                        return {type: "Literal", blocked: false, value: delete object.properties[propertyName]};
                      case "Array":
                        object.elements[propertyName] = {type: "Literal", value: undefined};
                        return {type: "Literal", blocked: false, value: true};
                      default:
                        console.warn(`Unhandled '${object.type}' deletion`);
                        acornSimulator.safe = false;
                        return {type: "Literal", blocked: false, value:true};
                    }
                  } else {
                    acornSimulator.resolve(ast.argument,undefined,[],scope,selfScope,thisScope);
                    return { type: "Literal", blocked: false, value: true };
                  }
                }else{
                  acornSimulator.resolve(ast.argument,undefined,[],scope,selfScope,thisScope);
                  console.warn(`Invalid delete target in strict mode`);
                  acornSimulator.safe = false;
                  return { type: "Literal", blocked: false, value: true};
                }
              }
            default:
              console.warn(`Unhandled '${ast.operator}' Unary operator resolution`);
              acornSimulator.safe = false;
              break;
          }
          break;
        }
        case "UpdateExpression":{
          let variable = ast.argument.type === "Identifier" ? acornSimulator.remember(ast.argument.name) : ast.argument.type === "MemberExpression" ? acornSimulator.resolve(ast.argument,undefined,[],scope,selfScope,thisScope).child : acornSimulator.resolve(ast.argument,undefined,[],scope,selfScope,thisScope);
          
          let coertion = acornSimulator.coerce(variable);
          
          

          if (!variable || variable.type !== "Literal") {
            console.error("UpdateExpression on non-literal or undefined variable");
            acornSimulator.safe = false;
            return { type: "Literal", blocked: false, value: undefined };
          }

          const oldValue = coertion.value;
          let newValue;
          
          if(coertion.value===_dynamic.properties.any.value){
            return newValue = _dynamic.properties.any;
          }else if(coertion.value.possibilities){
            let toreturn={possibilities:[]};
            newValue={posibilities:[]};
            for(let old of oldValue.possibilities){
              newValue.possibilities.push({...old});
              if (ast.operator === "++") newValue.possibilities[newValue.possibilities.length-1].value +=1;
              else if (ast.operator === "--") newValue.possibilities[newValue.possibilities.length-1].value -=1;
              else {
                console.warn(`Unhandled '${ast.operator}' update operator (probable)`);
                acornSimulator.safe = false;
                return { type: "Literal", blocked: false, value: undefined };
              }
              toreturn.possibilities.push(ast.prefix ? newValue.possibilities[newValue.possibilities.length-1] : {...old});
              old.value = newValue.possibilities[newValue.possibilities.length-1].value
            }
            
            return {
              type: "Literal",
              blocked: false,
              value:toreturn
            };
          }else{
            if (ast.operator === "++") newValue = oldValue + 1;
            else if (ast.operator === "--") newValue = oldValue - 1;
            else {
              console.warn(`Unhandled '${ast.operator}' update operator`);
              acornSimulator.safe = false;
              return { type: "Literal", blocked: false, value: undefined };
            }
            acornSimulator.assignVariable(ast.argument,{type: "Literal", blocked: false,value: newValue},undefined,[],scope,selfScope,thisScope);
          }

          return {
            type: "Literal",
            blocked: false,
            value: ast.prefix ? newValue : oldValue
          };
        }
        case "BinaryExpression":{
          let left = ast.left.type === "MemberExpression" ? acornSimulator.resolve(ast.left,undefined,[],scope,selfScope,thisScope).child : acornSimulator.resolve(ast.left,undefined,[],scope,selfScope,thisScope);
          let leftCoertion = acornSimulator.coerce(left);
          let right = ast.right.type === "MemberExpression" ? acornSimulator.resolve(ast.right,undefined,[],scope,selfScope,thisScope).child : acornSimulator.resolve(ast.right,undefined,[],scope,selfScope,thisScope);
          let rightCoertion = acornSimulator.coerce(right);
          
          if(leftCoertion.value===_dynamic.properties.any.value){
            return _dynamic.properties.any;
          }
          if(rightCoertion.value===_dynamic.properties.any.value){
            return _dynamic.properties.any;
          }
          
          switch(ast.operator){
            case '+': return { type: "Literal", blocked:false, value: leftCoertion.value + rightCoertion.value };
            case '-': return { type: "Literal", blocked:false, value: leftCoertion.value - rightCoertion.value };
            case '*': return { type: "Literal", blocked:false, value: leftCoertion.value * rightCoertion.value };
            case '/': return { type: "Literal", blocked:false, value: leftCoertion.value / rightCoertion.value };
            case '%': return { type: "Literal", blocked:false, value: leftCoertion.value % rightCoertion.value };
            case '===': return { type: "Literal", blocked:false, value: leftCoertion.value === rightCoertion.value };
            case '==': return { type: "Literal", blocked:false, value: leftCoertion.value == rightCoertion.value };
            case '!==': return { type: "Literal", blocked:false, value: leftCoertion.value !== rightCoertion.value };
            case '!=': return { type: "Literal", blocked:false, value: leftCoertion.value != rightCoertion.value };
            case '<': return { type: "Literal", blocked:false, value: leftCoertion.value < rightCoertion.value };
            case '<=': return { type: "Literal", blocked:false, value: leftCoertion.value <= rightCoertion.value };
            case '>': return { type: "Literal", blocked:false, value: leftCoertion.value > rightCoertion.value };
            case '>=': return { type: "Literal", blocked:false, value: leftCoertion.value >= rightCoertion.value };
            case '|': return { type: "Literal", blocked:false, value: leftCoertion.value | rightCoertion.value };
            case '&': return { type: "Literal", blocked:false, value: leftCoertion.value & rightCoertion.value };
            case '^': return { type: "Literal", blocked:false, value: leftCoertion.value ^ rightCoertion.value };
            case '<<': return { type: "Literal", blocked:false, value: leftCoertion.value << rightCoertion.value };
            case '>>': return { type: "Literal", blocked:false, value: leftCoertion.value >> rightCoertion.value };
            case '>>>': return { type: "Literal", blocked:false, value: leftCoertion.value >>> rightCoertion.value };
            case 'in':{
              if(right.type === "Object"){
                return { type: "Literal", value: leftCoertion.value in right.properties}
              }else if(right.type === "Array"){
                return { type: "Literal", value: leftCoertion.value in right.elements}
              }else{
                console.warn(`Unhandled ${rigth.type} type at binaryOperators "in"`);
                acornSimulator.safe = false;
                return{ type: "Literal", value: undefined}
              }
            }
            /**/case 'instanceof':{
              console.warn(`Unhandled '${ast.operator}' binary operator`);
              acornSimulator.safe = false;
              break;
            }
            default:
              console.warn(`Unhandled '${ast.operator}' binary operator`);
              acornSimulator.safe = false;
              break;
          }
          break;
        }
        case "LogicalExpression":{
          let left = acornSimulator.resolve(ast.left,undefined,[],scope,selfScope,thisScope);
          let coertion = acornSimulator.coerce(left);
          if(coertion.value===_dynamic.properties.any.value){
            return _dynamic.properties.any;
          }else if(coertion.value.possibilities){
            let toreturn = {possibilities:[]};
            for(let pos of coertion.value.possibilities){
              toreturn.possibilities.push(acornSimulator.resolve({type:"LogicalExpression",left:pos,right:ast.right,operator:ast.operator},def,indexing,scope,selfScope,thisScope))
            }
            return {
              type:"Literal",
              blocked: false,
              value: toreturn
            };
          }
          switch(ast.operator) {
            case "&&":{
              if (!coertion.value) return left;
              let resolution = acornSimulator.resolve(ast.right,undefined,[],scope,selfScope,thisScope);
              return resolution.child?resolution.child:resolution;
            }
            case "||":{
              if (coertion.value) return left;
              let resolution = acornSimulator.resolve(ast.right,undefined,[],scope,selfScope,thisScope);
              return resolution.child?resolution.child:resolution;
            }
            case "??":{
              if (coertion.value !== null && coertion.value !== undefined) return left;
              let resolution = acornSimulator.resolve(ast.right,undefined,[],scope,selfScope,thisScope);
              return resolution.child?resolution.child:resolution;
            }
            default:
              console.warn(`Unhandled '${ast.operator}' logical operator`);
              acornSimulator.safe = false;
              break;
          }
        }
        case "AssignmentExpression":{
          switch(ast.operator){
            case "=":
              {
                let assignation = acornSimulator.assignVariable(ast.left,ast.right,def,indexing,scope,selfScope,thisScope);
                return {type:assignation ? assignation.type : "Literal", value:assignation ? assignation.value === undefined ? def ? def.value : undefined : assignation.value : undefined};
              }
            case "+=":
              {
                let tarjet = acornSimulator.remember(ast.left.name);
                let resolution = acornSimulator.resolve(ast.right,def,indexing,scope,selfScope,thisScope);
                resolution = resolution.child?resolution.child:resolution;
                if(resolution.value===_dynamic.properties.any.value) tarjet.value = _dynamic.properties.any;
                else if(resolution.value.possibilities){
                  let toreturn = {possibilities:[]};
                  for(let pos of resolution.value.possibilities){
                    toreturn.possibilities.push({...pos});
                    toreturn.possibilities[toreturn.possibilities.length-1].value+=pos.value;
                  }
                  tarjet.value = toreturn;
                }
                else tarjet.value += resolution.value;
                return {type: resolution.type, value: resolution.value === undefined ? def ? def.value : undefined : resolution.value};
              }
            case "-=":
              {
                let tarjet = acornSimulator.remember(ast.left.name);
                let resolution = acornSimulator.resolve(ast.right,def,indexing,scope,selfScope,thisScope);
                resolution = resolution.child?resolution.child:resolution;
                if(resolution.value===_dynamic.properties.any.value) tarjet.value = _dynamic.properties.any;
                else if(resolution.value.possibilities){
                  let toreturn = {possibilities:[]};
                  for(let pos of resolution.value.possibilities){
                    toreturn.possibilities.push({...pos});
                    toreturn.possibilities[toreturn.possibilities.length-1].value-=pos.value;
                  }
                  tarjet.value = toreturn;
                }
                else tarjet.value -= resolution.value;
                return {type: resolution.type, value: resolution.value === undefined ? def ? def.value : undefined : resolution.value};
              }
            case "*=":
              {
                let tarjet = acornSimulator.remember(ast.left.name);
                let resolution = acornSimulator.resolve(ast.right,def,indexing,scope,selfScope,thisScope);
                resolution = resolution.child?resolution.child:resolution;
                if(resolution.value===_dynamic.properties.any.value) tarjet.value = _dynamic.properties.any;
                else if(resolution.value.possibilities){
                  let toreturn = {possibilities:[]};
                  for(let pos of resolution.value.possibilities){
                    toreturn.possibilities.push({...pos});
                    toreturn.possibilities[toreturn.possibilities.length-1].value*=pos.value;
                  }
                  tarjet.value = toreturn;
                }
                else tarjet.value *= resolution.value;

                return {type: resolution.type, value: resolution.value === undefined ? def ? def.value : undefined : resolution.value};
              }
            case "/=":
              {
                let tarjet = acornSimulator.remember(ast.left.name);
                let resolution = acornSimulator.resolve(ast.right,def,indexing,scope,selfScope,thisScope);
                resolution = resolution.child?resolution.child:resolution;
                if(resolution.value===_dynamic.properties.any.value) tarjet.value = _dynamic.properties.any;
                else if(resolution.value.possibilities){
                  let toreturn = {possibilities:[]};
                  for(let pos of resolution.value.possibilities){
                    toreturn.possibilities.push({...pos});
                    toreturn.possibilities[toreturn.possibilities.length-1].value/=pos.value;
                  }
                  tarjet.value = toreturn;
                }
                else tarjet.value /= resolution.value;

                return {type: resolution.type, value: resolution.value === undefined ? def ? def.value : undefined : resolution.value};
              }
            case "%=":
              {
                let tarjet = acornSimulator.remember(ast.left.name);
                let resolution = acornSimulator.resolve(ast.right,def,indexing,scope,selfScope,thisScope);
                resolution = resolution.child?resolution.child:resolution;
                if(resolution.value===_dynamic.properties.any.value) tarjet.value = _dynamic.properties.any;else if(resolution.value.possibilities){
                  let toreturn = {possibilities:[]};
                  for(let pos of resolution.value.possibilities){
                    toreturn.possibilities.push({...pos});
                    toreturn.possibilities[toreturn.possibilities.length-1].value%=pos.value;
                  }
                  tarjet.value = toreturn;
                }
                else tarjet.value %= resolution.value;

                return {type: resolution.type, value: resolution.value === undefined ? def ? def.value : undefined : resolution.value};
              }
            case "**=":
              {
                let tarjet = acornSimulator.remember(ast.left.name);
                let resolution = acornSimulator.resolve(ast.right,def,indexing,scope,selfScope,thisScope);
                resolution = resolution.child?resolution.child:resolution;
                if(resolution.value===_dynamic.properties.any.value) tarjet.value = _dynamic.properties.any;
                else if(resolution.value.possibilities){
                  let toreturn = {possibilities:[]};
                  for(let pos of resolution.value.possibilities){
                    toreturn.possibilities.push({...pos});
                    toreturn.possibilities[toreturn.possibilities.length-1].value**=pos.value;
                  }
                  tarjet.value = toreturn;
                }
                else tarjet.value **= resolution.value;

                return {type: resolution.type, value: resolution.value === undefined ? def ? def.value : undefined : resolution.value};
              }
            case "<<=":
              {
                let tarjet = acornSimulator.remember(ast.left.name);
                let resolution = acornSimulator.resolve(ast.right,def,indexing,scope,selfScope,thisScope);
                resolution = resolution.child?resolution.child:resolution;
                if(resolution.value===_dynamic.properties.any.value) tarjet.value = _dynamic.properties.any;else if(resolution.value.possibilities){
                  let toreturn = {possibilities:[]};
                  for(let pos of resolution.value.possibilities){
                    toreturn.possibilities.push({...pos});
                    toreturn.possibilities[toreturn.possibilities.length-1].value<<=pos.value;
                  }
                  tarjet.value = toreturn;
                }
                else tarjet.value <<= resolution.value;

                return {type: resolution.type, value: resolution.value === undefined ? def ? def.value : undefined : resolution.value};
              }
            case ">>=":
              {
                let tarjet = acornSimulator.remember(ast.left.name);
                let resolution = acornSimulator.resolve(ast.right,def,indexing,scope,selfScope,thisScope);
                resolution = resolution.child?resolution.child:resolution;
                if(resolution.value===_dynamic.properties.any.value) tarjet.value = _dynamic.properties.any;
                else if(resolution.value.possibilities){
                  let toreturn = {possibilities:[]};
                  for(let pos of resolution.value.possibilities){
                    toreturn.possibilities.push({...pos});
                    toreturn.possibilities[toreturn.possibilities.length-1].value>>=pos.value;
                  }
                  tarjet.value = toreturn;
                }
                else tarjet.value >>= resolution.value;

                return {type: resolution.type, value: resolution.value === undefined ? def ? def.value : undefined : resolution.value};
              }
            case ">>>=":
              {
                let tarjet = acornSimulator.remember(ast.left.name);
                let resolution = acornSimulator.resolve(ast.right,def,indexing,scope,selfScope,thisScope);
                resolution = resolution.child?resolution.child:resolution;
                if(resolution.value===_dynamic.properties.any.value) tarjet.value = _dynamic.properties.any;
                else if(resolution.value.possibilities){
                  let toreturn = {possibilities:[]};
                  for(let pos of resolution.value.possibilities){
                    toreturn.possibilities.push({...pos});
                    toreturn.possibilities[toreturn.possibilities.length-1].value>>>=pos.value;
                  }
                  tarjet.value = toreturn;
                }
                else tarjet.value >>>= resolution.value;

                return {type: resolution.type, value: resolution.value === undefined ? def ? def.value : undefined : resolution.value};
              }
            case "&=":
              {
                let tarjet = acornSimulator.remember(ast.left.name);
                let resolution = acornSimulator.resolve(ast.right,def,indexing,scope,selfScope,thisScope);
                resolution = resolution.child?resolution.child:resolution;
                if(resolution.value===_dynamic.properties.any.value) tarjet.value = _dynamic.properties.any;
                else if(resolution.value.possibilities){
                  let toreturn = {possibilities:[]};
                  for(let pos of resolution.value.possibilities){
                    toreturn.possibilities.push({...pos});
                    toreturn.possibilities[toreturn.possibilities.length-1].value&=pos.value;
                  }
                  tarjet.value = toreturn;
                }
                else tarjet.value &= resolution.value;

                return {type: resolution.type, value: resolution.value === undefined ? def ? def.value : undefined : resolution.value};
              }
            case "|=":
              {
                let tarjet = acornSimulator.remember(ast.left.name);
                let resolution = acornSimulator.resolve(ast.right,def,indexing,scope,selfScope,thisScope);
                resolution = resolution.child?resolution.child:resolution;
                if(resolution.value===_dynamic.properties.any.value) tarjet.value = _dynamic.properties.any;
                else if(resolution.value.posibilities){
                  let toreturn = {possibilities:[]};
                  for(let pos of resolution.value.possibilities){
                    toreturn.possibilities.push({...pos});
                    toreturn.possibilities[toreturn.possibilities.length-1].value|=pos.value;
                  }
                  tarjet.value = toreturn;
                }
                else tarjet.value |= resolution.value;

                return {type: resolution.type, value: resolution.value === undefined ? def ? def.value : undefined : resolution.value};
              }
            case "^=":
              {
                let tarjet = acornSimulator.remember(ast.left.name);
                let resolution = acornSimulator.resolve(ast.right,def,indexing,scope,selfScope,thisScope);
                resolution = resolution.child?resolution.child:resolution;
                if(resolution.value===_dynamic.properties.any.value) tarjet.value = _dynamic.properties.any;
                else if(resolution.value.possibilities){
                  let toreturn = {possibilities:[]};
                  for(let pos of resolution.value.possibilities){
                    toreturn.possibilities.push({...pos});
                    toreturn.possibilities[toreturn.possibilities.length-1].value^=pos.value;
                  }
                  tarjet.value = toreturn;
                }
                else tarjet.value ^= resolution.value;

                return {type: resolution.type, value: resolution.value === undefined ? def ? def.value : undefined : resolution.value};
              }
            case "&&=":
              {
                let tarjet = acornSimulator.remember(ast.left.name);
                let resolution = acornSimulator.resolve(ast.right,def,indexing,scope,selfScope,thisScope);
                resolution = resolution.child?resolution.child:resolution;
                if(resolution.value===_dynamic.properties.any.value) tarjet.value = _dynamic.properties.any;
                else if(resolution.value.possibilities){
                  let toreturn = {possibilities:[]};
                  for(let pos of resolution.value.possibilities){
                    toreturn.possibilities.push({...pos});
                    toreturn.possibilities[toreturn.possibilities.length-1].value&&=pos.value;
                  }
                  tarjet.value = toreturn;
                }
                else tarjet.value &&= resolution.value;

                return {type: resolution.type, value: resolution.value === undefined ? def ? def.value : undefined : resolution.value};
              }
            case "||=":
              {
                let tarjet = acornSimulator.remember(ast.left.name);
                let resolution = acornSimulator.resolve(ast.right,def,indexing,scope,selfScope,thisScope);
                resolution = resolution.child?resolution.child:resolution;
                if(resolution.value===_dynamic.properties.any.value) tarjet.value = _dynamic.properties.any;
                else if(resolution.value.possibilities){
                  let toreturn = {possibilities:[]};
                  for(let pos of resolution.value.possibilities){
                    toreturn.possibilities.push({...pos});
                    toreturn.possibilities[toreturn.possibilities.length-1].value||=pos.value;
                  }
                  tarjet.value = toreturn;
                }
                else tarjet.value ||= resolution.value;

                return {type: resolution.type, value: resolution.value === undefined ? def ? def.value : undefined : resolution.value};
              }
            case "??=":
              {
                let tarjet = acornSimulator.remember(ast.left.name);
                let resolution = acornSimulator.resolve(ast.right,def,indexing,scope,selfScope,thisScope);
                resolution = resolution.child?resolution.child:resolution;
                if(resolution.value===_dynamic.properties.any.value) tarjet.value = _dynamic.properties.any;
                else if(resolution.value.possibilities){
                  let toreturn = {possibilities:[]};
                  for(let pos of resolution.value.possibilities){
                    toreturn.possibilities.push({...pos});
                    toreturn.possibilities[toreturn.possibilities.length-1].value??=pos.value;
                  }
                  tarjet.value = toreturn;
                }
                else tarjet.value ??= resolution.value;

                return {type: resolution.type, value: resolution.value === undefined ? def ? def.value : undefined : resolution.value};
              }
            default:
              console.warn(`Unhandled '${ast.operator}' asignation resolution`);
              acornSimulator.safe = false;
              break;
          }
        }
        case "ConditionalExpression": {
          let test = acornSimulator.resolve(ast.test, undefined, [], scope, selfScope, thisScope);
          test = test.child?test.child:test;
          if(test.value===_dynamic.properties.any.value){
            return _dynamic.properties.any;
          }else if(test.value.possibilities){
            let possibilities = [];
            for(let pos of test.value.possibilities){
              possibilities.push(acornSimulator.coerce(pos).value? acornSimulator.resolve(ast.consequent, undefined, [], scope, selfScope, thisScope)
          : acornSimulator.resolve(ast.alternate, undefined, [], scope, selfScope, thisScope));
            }
            return _dynamic.properties.possibilities.run(...possibilities);
          }
          const testValue = acornSimulator.coerce(test).value;

          return testValue
            ? acornSimulator.resolve(ast.consequent, undefined, [], scope, selfScope, thisScope)
          : acornSimulator.resolve(ast.alternate, undefined, [], scope, selfScope, thisScope);
        }
        case "SequenceExpression":{
          let result = {type: "Literal", value: undefined};
          for(let expression of ast.expressions){
            result = acornSimulator.resolve(expression,undefined,[],scope,selfScope,thisScope);
          }
          result = result.child?result.child:result;
          return result;
        }
        case "CallExpression":{
          let resolution = acornSimulator.resolve(ast.callee,undefined,[],scope,undefined,thisScope);
          if(resolution.value === _dynamic.properties.any.value){
            console.warn("trying to execute dynamicly");
            acornSimulator.safe = false;
            return {type:"Literal",value:undefined};
          }
          return acornSimulator.call(ast.callee.type === "MemberExpression" ? resolution.child : resolution,ast.callee,ast.arguments,scope,thisScope);
        }
        case "NewExpression":{
          let callee = acornSimulator.resolve(ast.callee);
          
          switch(callee.type){
            case "Class":{
              let constructor = undefined;
              let internals = {}
              for(let line of callee.body){
                //console.log("static:",line.static); //assigns methods to the class itself and not it´s instancies.
                //console.log("computed:",line.computed);
                //console.log("key name:",line.key.name);
                //console.log("kind:",line.kind);
                if(line.static){
                    console.warn(`Unhandled static or computed '${line.key.name}' method on class.`);
                    acornSimulator.safe = false;
                }
                internals[line.computed? acornSimulator.coerce(acornSimulator.resolve(line.key,undefined,[],scope,selfScope,thisScope)).value : line.key.name] = acornSimulator.resolve(line.value);
                if(line.type === "MethodDefinition"){
                  if(line.kind === "constructor") constructor = acornSimulator.resolve(line.value);
                }
              }

              //console.log(callee.id||ast.callee.name)

              let result = {
                name:ast.callee.name,
                type: "Object",
                kind: "init",
                blocked: false,
                prototype: callee.prototype,
                properties: {}
              };

              if(constructor){
                acornSimulator.call(constructor,ast.callee,ast.arguments,scope,result);
              }

              for(let internal of Object.keys(internals)){
                result.properties[internal]=internals[internal]
              }

              return result;
            }
            case "Evaluation":
              let args = [];
              for(let arg of ast.arguments){
                args.push(acornSimulator.resolve(arg,undefined,indexing,scope,selfScope,thisScope));
              }
              return callee.run(...args);
            case "Literal":
              if(callee.value === _dynamic.properties.any.value){
                console.warn(`Trying to initialize a new dynamic`);
                acornSimulator.safe = false;
                break;
              }
            default:
              console.warn(`Unhandled '${callee.type}' new expression`);
              acornSimulator.safe = false;
              break;
          }
          break;
        }
        case "MemberExpression":{
          let object = ast.object.type === "MemberExpression" || ast.object.type === "ThisExpression" ? acornSimulator.remember(acornSimulator.resolve(ast.object,undefined,[],scope,selfScope,thisScope).name) : acornSimulator.remember(ast.object.name);
          
          

          switch(object.type){
            case "Object": {
              let prop = ast.computed ? acornSimulator.coerce(acornSimulator.resolve(ast.property,undefined,[],scope,ast.object,thisScope)).value : ast.property.name;
              let child = object.properties[prop];
              child = child?child.child?child.child:child:undefined;
              let toreturn = {parent:ast.object, child: child ? child.blocked === undefined? acornSimulator.remember("_object_").properties[prop]: child: acornSimulator.remember("_object_").properties[prop]};
              
              if(toreturn.child){
                Object.defineProperty(toreturn.child, "thisValue", {
                  value: object,
                  enumerable: false,
                  writable: true,
                  configurable: true
                });

                if(toreturn.child.blocked) {
                  console.warn("Attempt to access blocked external");
                  acornSimulator.safe = false;
                };
              }
              return toreturn;
            }
            case "Array": {
              let prop = ast.computed ? acornSimulator.coerce(acornSimulator.resolve(ast.property,undefined,[],scope,ast.object,thisScope)).value : ast.property.name;
              let child = object.elements[prop];
              let toreturn = {parent:ast.object, child: child ? child.blocked === undefined? acornSimulator.remember("_array_").properties[prop]: child: acornSimulator.remember("_array_").properties[prop]};
              
              Object.defineProperty(toreturn.child, "thisValue", {
                value: object,
                enumerable: false,
                writable: true,
                configurable: true
              });
              
              if(toreturn.child.blocked) {
                console.warn("Attempt to access blocked external");
                acornSimulator.safe = false;
              };
              return toreturn;
            }
            case "Class": {
              let prop = ast.computed ? acornSimulator.coerce(acornSimulator.resolve(ast.property,undefined,[],scope,ast.object,thisScope)).value : ast.property.name;
              let child = thisScope.properties[prop];
              let toreturn = {parent:thisScope, child: child ?
                              child.blocked === undefined?
                                acornSimulator.remember("_class_").properties[prop]
                              :
                                child
                            :
                              acornSimulator.remember("_class_").properties[prop]};
              if(toreturn.child){
                Object.defineProperty(toreturn.child, "thisValue", {
                  value: object,
                  enumerable: false,
                  writable: true,
                  configurable: true
                });

                if(toreturn.child.blocked) {
                  console.warn("Attempt to access blocked external");
                  acornSimulator.safe = false;
                };
              }
              return toreturn;
            }
            case "Literal": {
              if(object.value === _dynamic.properties.any.value){
                return {father:object,child:{type: "Literal", blocked:false, value:_dynamic.properties.any.value}};
              }else{
                let prop = ast.computed ? acornSimulator.coerce(acornSimulator.resolve(ast.property,undefined,[],scope,ast.object,thisScope)).value : ast.property.name;
                return {father:object,child:{type: "Literal", blocked:false, value:object.value[prop]}};
              }
            }
            case "Function":
            case "Evaluation":{
              if(object.properties){
                let prop = ast.computed ? acornSimulator.coerce(acornSimulator.resolve(ast.property,undefined,[],scope,ast.object,thisScope)).value : ast.property.name;
                return {father:object,child:object.properties[prop]};
              }else{
                return {father:object,child:{type: "Literal", blocked:false, value:undefined}};
              }
            }
            default:
              console.warn(`Unhandled '${object.type}' member resolution`);
              acornSimulator.safe = false;
              return {type: "Literal", blocked:false, value:undefined}
          }
        }
        /**/case "YieldExpression":{
            console.warn(`Unhandled '${ast.type}' resolution`);
            acornSimulator.safe = false;
            break;
          }
        /**/case "AwaitExpression":{
            console.warn(`Unhandled '${ast.type}' resolution`);
            acornSimulator.safe = false;
            break;
          }
        case "ImportExpression":{
            console.warn(`Use of dynamic Import()`);
            acornSimulator.safe = false;
            break;
          }
        default:
          console.warn(`Unhandled '${ast.type}' resolution`);
          acornSimulator.safe = false;
          break;
      }
    }
    return {type: "Literal", value:undefined};
  },
  call: (resolution,callee,argus,scope,thisScope)=>{
    let mem = acornSimulator.remember(callee.type === "Identifier" ? callee.name : "undefined");
    if(resolution.type === "Evaluation") {
      let args = [];
      for(let arg of argus){
        let res = acornSimulator.resolve(arg,undefined,[],scope);
        args.push(res.child?res.child:res);
      }
      return resolution.call(...args);
    };
    let TDZs = acornSimulator.prepare(resolution.body);
    for(let i in resolution.params){
      let param;
      if(mem.type === "Class"){
        param = resolution.params[i];
      }else{
        param = mem.params[i];
      }
      let arg = argus[i];
      switch(param.type){
        case "Identifier":
          if(acornSimulator.memory.find(mem => mem.name === param.name && !mem.TDZ)||externals.find(ext => ext.name === param.name && !ext.TDZ)) { //not all params are already defined, so we are not using remember(); but doing it by hand.
            mem.TDZ = true
            TDZs.push(mem);
          };
          acornSimulator.declareVariable(param,arg,undefined,"init",[],scope+"/function");
          break;
        default:
          console.warn(`Unhandled '${param.type}' parameter parsing`); 
          acornSimulator.safe = false;
          break;
      }
    }
    
    let result = acornSimulator.simulate(resolution,scope+"/function",resolution.type==="Function" ? mem.type === "Class"? thisScope : callee.type === "MemberExpression"? acornSimulator.resolve(callee).parent : undefined : resolution.type === "ArrowFunction" ? thisScope : undefined);
    
    acornSimulator.forget(scope+"/function");

    for(let tdz of TDZs){
      tdz.TDZ = false;
    }

    return result.return ? result.return.child ? result.return.child : result.return : result;
  },
  coerce: (variable)=>{
    switch(variable.type){
      case "Literal":
        return {type:"Literal", value: variable.value};
      case "Array":{
        const coercedElements = variable.elements.map(element => {
          if (element == null) return {type:"Literal", value:""}; // sparse or undefined/null → ""
          let coerced = acornSimulator.coerce(element);
          return coerced.value != null ? String(coerced.value) : "";
        });
        const result = coercedElements.join(",");
        return {type: "Literal", value: result};
      }
      case "Object":
        return {type:"Literal", value: "[object Object]"};
      case "Function":{
        console.warn(`Unhandled '${variable.type}' coercion`);
        acornSimulator.safe = false;
        break;
      }
      case "ArrowFunction":
        console.warn(`Unhandled '${variable.type}' coercion`);
        acornSimulator.safe = false;
        break;
      case "Class":
        console.warn(`Unhandled '${variable.type}' coercion`);
        acornSimulator.safe = false;
        break;
      case "Evaluation":
        return variable.get();
      default:
        console.warn(`Unhandled '${variable.type}' coercion`);
        acornSimulator.safe = false;
        break;
    }
    return {type:"Literal", value:""};
  }
}

function acornScanner(userCode){
	acornSimulator.reset();
  try{
		externals = extPool1;

    let pcode = acorn.parse(userCode, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
    acornSimulator.simulate(pcode,"main",undefined);
    
    /*
    externals = extPool2;
    
    acornSimulator.simulate(acorn.parse(`
      preload();
      setup();
      mousePressed(_Dynamic_.any);
      mouseReleased(_Dynamic_.any);
      mouseClicked(_Dynamic_.any);
      mouseMoved(_Dynamic_.any);
      mouseDragged(_Dynamic_.any);
      mouseWheel(_Dynamic_.any);
      keyPressed(_Dynamic_.any);
      keyReleased(_Dynamic_.any);
      keyTyped(_Dynamic_.any);
      touchStarted(_Dynamic_.any);
      touchMoved(_Dynamic_.any);
      touchEnded(_Dynamic_.any);
      windowResized(_Dynamic_.any);
      deviceMoved(_Dynamic_.any);
      deviceTurned(_Dynamic_.any);
      deviceShaken(_Dynamic_.any);
      gamepadConnected(_Dynamic_.any);
      gamepadDisconnected(_Dynamic_.any);
    `, { ecmaVersion: 'latest', sourceType: 'module', locations: true }),"main",undefined);
    acornSimulator.simulate(acorn.parse(`draw;`, { ecmaVersion: 'latest', sourceType: 'module', locations: true }), "main", undefined, {dynamic:true});
    
    //*/
  }catch(err){
    dropError("",err);
    acornSimulator.safe = false;
  }
  return acornSimulator.safe;
}

let ExternalBuilder = (description,custom,pool)=>{
  let split = description.split(".")
  let isFunction = split[split.length-1].substring(split[split.length-1].length-2)==="()";
  let name = isFunction?split[split.length-1].substring(split[split.length-1].length-2)==="()"?split[split.length-1].substring(0,split[split.length-1].length-2):split[split.length-1]:split[split.length-1];
  let parent;
  let external;
  
  
  
  const constructFn = () => {return {type: "Object", blocked:false, properties:{}}};
  const callFn = () => {return {type: "Literal", blocked:false, value: undefined}};
	const stubNative = (name) => () => {return {type: "Literal", value: `function ${name}() { [native code] }`}};
  
  if(split.length>1){
    parent = pool.find(ext => ext.name === split[0])
    if(!parent){
      parent = pool[pool.push({
        name:split[0],
        TDZ:split.length>1?undefined:false,
        used:split.length>1?undefined:true,
        blocked:false,
        type:"Object",
        properties:{},
      })-1];
    }
    for(let i = 1 ; i < split.length-1 ; i++){
      let p = parent;
      parent = parent.properties[split[i]];
      if(!parent){
        p.properties[split[i]]={
          blocked:false,
          type:"Object",
          properties:{},
        };
        parent = p.properties[split[i]]
      }
    }
    let p = parent;
    if(!parent.properties) parent.type = "Object", parent.value = undefined, parent.properties = {};
    parent = parent.properties[split[split.length-1]];
    if(!parent){
      p.properties[name]={
        blocked:custom?.block!==undefined?custom.block:false,
        type:isFunction?"Evaluation":"Literal",
        value:isFunction?undefined:custom?.value?custom.value:custom?.undefine?undefined:(custom?.type&&custom?.type!=="Literal")?undefined:(()=>{try{return eval(description)}catch(e){undefined}})(),
        properties:custom?.properties?custom.properties:(custom?.type==="Object"||custom?.type==="Array"||custom?.type==="Function"||custom?.type==="Class"||custom?.type==="Evaluation")?{}:isFunction?{}:undefined,
        construct:isFunction?custom?.construct?custom.construct:custom?.undefine?constructFn:(...args)=>{
          let argGathering = [];
          for(let arg of args){
            let val = acornSimulator.coerce(arg).value;
            argGathering.push(typeof val === "string"?`"${val}"`:val);
          }
          let evaluation = eval("new "+description.substring(0,description.length-1)+[...argGathering]+");");
          return traduction(evaluation);
        }:undefined,
        call:isFunction?custom?.call?custom.call:custom?.undefine?callFn:(...args)=>{
          let argGathering = [];
          for(let arg of args){
            let val = acornSimulator.coerce(arg).value;
            argGathering.push(typeof val === "string"?`"${val}"`:val);
          }
          let evaluation = eval(description.substring(0,description.length-1)+[...argGathering]+");");
          return traduction(evaluation);
        }:undefined,
        get:isFunction?custom?.get?custom.get:custom?.undefine?stubNative(name):()=>{
          let evaluation = eval(description.substring(0,description.length-2));
          return {type:"Literal",value:evaluation.toString()};
        }:undefined,
      };
      external = p.properties[split[split.length-1]];
    }
  }else{
    external = pool[pool.push({
      name:split.length>1?undefined:name,
      TDZ:split.length>1?undefined:false,
      used:split.length>1?undefined:true,
      blocked:custom?.block!==undefined?custom.block:false,
      type:isFunction?"Evaluation":custom?.type?custom.type:"Literal",
      value:isFunction?undefined:custom?.value?custom.value:custom?.undefine?undefined:(custom?.type&&custom?.type!=="Literal")?undefined:(()=>{try{return eval(description)}catch(e){undefined}})(),
      properties:custom?.properties?custom.properties:(custom?.type==="Object"||custom?.type==="Array"||custom?.type==="Function"||custom?.type==="Class"||custom?.type==="Evaluation")?{}:isFunction?{}:undefined,
      construct:isFunction?custom?.construct?custom.construct:custom?.undefine?constructFn:(...args)=>{
        let argGathering = [];
        for(let arg of args){
          let val = acornSimulator.coerce(arg).value;
          argGathering.push(typeof val === "string"?`"${val}"`:val);
        }
        let evaluation = eval("new "+description.substring(0,description.length-1)+[...argGathering]+");");
        return traduction(evaluation);
      }:undefined,	
      call:isFunction?custom?.call?custom.call:custom?.undefine?callFn:(...args)=>{
        let argGathering = [];
        for(let arg of args){
          let val = acornSimulator.coerce(arg).value;
          argGathering.push(typeof val === "string"?`"${val}"`:val);
        }
        let evaluation = eval(description.substring(0,description.length-1)+[...argGathering]+");");
        return traduction(evaluation);
      }:undefined,	
      get:isFunction?custom?.get?custom.get:custom?.undefine?stubNative(name):()=>{
        let evaluation = eval(description.substring(0,description.length-2));
        return {type:"Literal",value:evaluation.toString()};
      }:undefined,
    })-1];
  }
  
  let builder = {
		build:()=>external,
  }
  return builder;
}

function getExternals1(){
	let pool = [];
  ExternalBuilder("_Dynamic_.any",{value:{}},pool).build();
  ExternalBuilder("_Dynamic_.possibilities",{
    call:(...args)=>{return {type: "Literal", value: {possibilities:[...args]}};},
    get:()=>{return {type:"Literal",value:undefined};}
  },pool).build();
  const selfHandledFunctions = ["preload","setup","draw","mousePressed","mouseReleased","mouseClicked","mouseMoved","mouseDragged","mouseWheel","keyPressed","keyReleased","keyTyped","touchStarted","touchMoved","touchEnded","windowResized","deviceMoved","deviceTurned","deviceShaken","gamepadConnected","gamepadDisconnected"];
  for(let p5fn of selfHandledFunctions){
    ExternalBuilder(p5fn+"()",{undefine:true},pool).build();
  }
  const jsBuiltins = Object.getOwnPropertyNames(globalThis).filter(name => {
    try {
      const val = globalThis[name];
      // Only keep standard constructors/functions/objects
      return typeof val === "function" || typeof val === "object";
    } catch {
      return false;
    }
  });

  const allowedGlobals = Object.freeze([
    // Tipos básicos
    "Object", "Function", "Array", "Number", "parseFloat", "parseInt", 
    "Boolean", "String", "Symbol", "Date", "Promise", "RegExp",
    "Error", "AggregateError", "EvalError", "RangeError", "ReferenceError", 
    "SyntaxError", "TypeError", "URIError",

    // Utilidades
    "JSON", "Math", "Intl",
    "undefined",
    "Infinity",
    "NaN",

    // Binarios y memoria
    "ArrayBuffer", "Atomics", "DataView",
    "Uint8Array", "Int8Array", "Uint16Array", "Int16Array",
    "Uint32Array", "Int32Array", "BigUint64Array", "BigInt64Array",
    "Uint8ClampedArray", "Float32Array", "Float64Array",

    // Estructuras de datos
    "Map", "Set", "WeakMap", "WeakSet", "BigInt",

    // Metaprogramación
    "Proxy", "Reflect",

    // Limpieza de memoria
    "FinalizationRegistry", "WeakRef",

    // Funciones globales seguras
    "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent",
    "escape", "unescape", "eval", "isFinite", "isNaN",

    // Consola para debug
    "console",

    // Tu ecosistema
    "p5", "JSZip", "acorn", "prettier", "prettierPlugins",

    // APIs IDE específicas
    "IDEEditorUndo", "IDEEditorRedo", "IDERunSketch", "IDEStopSketch",
    "IDEPauseSketch", "IDERunSketchStep", "IDEEditorSort",
    "IDEToggleHotReload", "IDEToggleSketchExecution",
    // … y el resto de tus helpers internos

    // Entrada del usuario
    "keyIsPressed", "key", "keyCode", "mouseX", "mouseY", "pmouseX", "pmouseY",
    "mouseIsPressed", "touchX", "touchY", "touches", "mouseButton", "mouseWheel",

    // Funciones p5 que dependen del runtime
    "frameCount", "deltaTime", "frameRate",
    "millis", // tiempo desde inicio del sketch
    "random", "randomGaussian", // valores aleatorios
    "noise", "noiseDetail", // ruido procedural

    // Eventos de usuario y sensores
    "deviceOrientation", "deviceRotationRate", "deviceAcceleration", // según p5 o Web API

    "localStorage",
  ]);

  for(let al of allowedGlobals){
    ExternalBuilder(typeof globalThis[al] === "function"?al+"()":al,{},pool).build();
    let deepness = 0;
    let visits = [];
    function externProperties(obj,title){
      if(visits.includes(obj)){
        return;
      }
      let props=Object.getOwnPropertyNames(obj);
      for(let prop of props){
        let subtitle = "";
        if(!["caller","callee","arguments"].includes(prop)){
          let obj2;
          try{
            obj2 = obj[prop];
          }catch(e){
            obj2 = undefined;
          }
          if(prop==="prototype"){
            subtitle = title.substring(0,title.length-1).split(".").splice(0,title.substring(0,title.length-1).split(".").length-1).join(".")+"._"+title.substring(0,title.length-1).split(".")[title.substring(0,title.length-1).split(".").length-1].substring(0,title.length-1).toLowerCase()+"_";
            if(subtitle[0]==='.'){
              subtitle=subtitle.substring(1,subtitle.length);
            }
          }else{
            subtitle = title+prop;
            //console.log(subtitle);
          }
          ExternalBuilder(typeof obj2 === "function"?subtitle+"()":subtitle,{},pool).build();
          if(typeof obj2 === "object" || typeof obj2 === "function"){
            let tit = subtitle+".";
            visits.push(obj);
            deepness++;
            if(obj[prop]) externProperties(obj2,tit);
            deepness--;
            visits.pop();
          }
        }
      }
    }
    let obj = globalThis[al];
    if(obj){
      let title = al+"."
      externProperties(obj,title);
    }
  }

  const dynamicGlobals = [
    // Entrada del usuario
    "keyIsPressed", "key", "keyCode", "mouseX", "mouseY", "pmouseX", "pmouseY",
    "mouseIsPressed", "touchX", "touchY", "touches", "mouseButton", "mouseWheel",

    // Funciones p5 que dependen del runtime
    "frameCount", "deltaTime", "frameRate",
    "millis", // tiempo desde inicio del sketch
    "random", "randomGaussian", // valores aleatorios
    "noise", "noiseDetail", // ruido procedural

    "Math.random",
    "Date",
    "Date.now",

    "localStorage",

    // Eventos de usuario y sensores
    "deviceOrientation", "deviceRotationRate", "deviceAcceleration", // según p5 o Web API
  ];

  for(let dy of dynamicGlobals){
    let parts = dy.split(".");
    let element = undefined;
    if(parts.length>1){
      let parent = pool.find(ext=>ext.name === parts[0]);
      function getElement(parent,parts){
        if(parts.length>1){
          let parent = parent.properties.find(pro=>pro.name === parts[0]);
          parts.shift();
          getElement(parent,parts);
        }else{
          return parent.properties[Object.keys(parent.properties).find(pro=>pro === parts[0])];
        }
      }
      parts.shift();
      element = getElement(parent,parts);
    }else{
      element = pool.find(ext=>ext.name === parts[0]);
      element.value = pool.find(ext=>ext.name === "_Dynamic_").properties.any.value;
    }
    if(element.type==="Evaluation"){
      element.call = ()=>{return externals.find(ext=>ext.name === "_Dynamic_").properties.any}
    }else{
      element.value = pool.find(ext=>ext.name === "_Dynamic_").properties.any.value;
    }
  }
  
  return pool;
}

function getExternals2(){
  let pool=[...extPool1];
  
	let p5BuiltIns = [
    "arc",
    "circle",
    "ellipse",
    "line",
    "point",
    "quad",
    "rect",
    "square",
    "triangle",

    "ellipseMode",
    "noSmooth",
    "rectMode",
    "smooth",
    "strokeCap",
    "strokeJoin",
    "strokeWeight",

    "bezier",
    "bezieerDetail",
    "bezierPoint",
    "bezierTangent",
    "curve",
    "curveDetail",
    "curvePoint",
    "curveTangent",
    "curveTightness",

    "beginContour",
    "beginShape",
    "bezierVertex",
    "curveVertex",
    "endContour",
    "endShape",
    "quadraticVertex",
    "vertex",

    "alpha",
    "blue",
    "brightness",
    "color",
    "green",
    "hue",
    "lerpColor",
    "lightness",
    "paletteLerp",
    "red",
    "saturation",

    "background",
    "beginClip",
    "clear",
    "clip",
    "colorMode",
    "endClip",
    "erase",
    "fill",
    "noErase",
    "noFill",
    "noStroke",
    "stroke",

    "setAlpha",
    "setBlue",
    "setGreen",
    "setRed",
    "toString",

    "textAlign",
    "textAscent",
    "textDescent",
    "textLeading",
    "textSize",
    "textStyle",
    "textWidth",
    "textWrap",

    "loadFont",
    "text",
    "textFont",

    "Font",
    "textBounds",
    "textToPoints",

    "createImage",

    "image",
    "imageMode",
    "loadImage",
    "noTint",
    "tint",

    "blend",
    "copy",
    "filter",
    "get",
    "loadPixels",
    "pixels",
    "set",
    "updatePixels",

    "blend",
    "copy",
    "delay",
    "filter",
    "get",
    "getCurrentFrame",
    "height",
    "loadPixels",
    "mask",
    "numFrames",
    "pause",
    "pixelDensity",
    "pixels",
    "play",
    "reset",
    "resize",
    "set",
    "setFrame",
    "updatePixels",
    "width",

    "applyMatrix",
    "resetMatrix",
    "rotate",
    "rotateX",
    "rotateY",
    "rotateZ",
    "scale",
    "shearX",
    "shearY",
    "translate",

    "cursor",
    "deltaTime",
    "describe",
    "describeElement",
    "displayDensity",
    "displayHeight",
    "displayWidth",
    "focused",
    "frameCount",
    "frameRate",
    "getTargetFrameRate",
    "getURL",
    "getURLParams",
    "getURLPatch",
    "gridOutput",
    "height",
    "noCursor",
    "pixelDensity",
    "print",
    "textOutput",
    "webglVersion",
    "width",
    "windowHeight",
    "windowResized",
    "windowWidth",

    "blendMode",
    "clearDepth",
    "createCanvas",
    "createFramebuffer",
    "createGraphics",
    "drawingContext",
    "noCanvas",
    "resizeCanvas",
    "setAttributes",

    "abs",
    "ceil",
    "constrain",
    "dist",
    "exp",
    "floor",
    "fract",
    "lerp",
    "log",
    "mag",
    "map",
    "max",
    "min",
    "norm",
    "pow",
    "round",
    "sq",
    "sqrt",

    "noise",
    "noiseDetail",
    "noiseSeed",

    "random",
    "randomGaussian",
    "randomSeed",

    "acos",
    "angleMode",
    "asin",
    "atan",
    "atan2",
    "cos",
    "degrees",
    "radians",
    "sin",
    "tan",

    "createVector",

    "day",
    "hour",
    "millis",
    "month",
    "second",
    "year",

    "accelerationX",
    "accelerationY",
    "accelerationZ",
    "deviceMoved",
    "deviceOrientation",
    "deviceShaken",
    "deviceTurned",
    "pAccelerationX",
    "pAccelerationY",
    "pAccelerationZ",
    "pRotationX",
    "pRotationY",
    "pRotationZ",
    "rotationX",
    "rotationY",
    "rotationZ",
    "setMoveThreshold",
    "setShakeThreshold",
    "turnAxis",

    "key",
    "keyCode",
    "keyIsDown",
    "keyIsPressed",
    "keyPressed",
    "keyReleased",
    "keyTyped",

    "doubleClicked",
    "exitPointerLock",
    "mouseButton",
    "mouseClicked",
    "mouseDragged",
    "mouseIsPressed",
    "mouseMoved",
    "mousePressed",
    "mouseReleased",
    "mouseWeel",
    "mouseX",
    "mouseY",
    "movedX",
    "movedY",
    "pmouseX",
    "pmouseY",
    "pwinMoueX",
    "pwinMouseY",
    "requestPointerLock",
    "winMouseX",
    "winMouseY",

    "touchEnded",
    "touchMoved",
    "touchStarted",
    "touches",

    "shuffle",

    "boolean",
    "byte",
    "char",
    "float",
    "hex",
    "int",
    "str",
    "unchar",
    "unhex",

    "clearStorage",
    "getItem",
    "removeItem",
    "storeItem",

    "join",
    "match",
    "matchAll",
    "nf",
    "nfc",
    "nfp",
    "nfs",
    "Split",
    "splitTokens",
    "trim",

    "disableFriendlyErrors",
    "draw",
    "isLooping",
    "loop",
    "noloop",
    "pop",
    "preload",
    "push",
    "redraw",
    "remove",
    "setup",

    "AUTO",
    "DEGREES",
    "HALF_PI",
    "HSB",
    "P2D",
    "PI",
    "QUARTER_PI",
    "RADIANS",
    "TAU",
    "TWO_PI",
    "VERSION",
  ]

  let p5Dynamics = [
    "height",
    "width",
    "frameCount",
    "frameRate",
    "getTargetFrameRate",
    "getURL",
    "getURLParams",
    "getURLPatch",
    "gridOutput",
    "windowHeight",
    "windowWidth",
    "noise",
    "random",
    "randomGaussian",
    "day",
    "hour",
    "millis",
    "month",
    "second",
    "year",
    "accelerationX",
    "accelerationY",
    "accelerationZ",
    "deviceOrientation",
    "pAccelerationX",
    "pAccelerationY",
    "pAccelerationZ",
    "pRotationX",
    "pRotationY",
    "pRotationZ",
    "rotationX",
    "rotationY",
    "rotationZ",
    "turnAxis",

    "key",
    "keyCode",
    "keyIsPressed",
    "keyIsDown",

    "doubleClicked",
    "mouseButton",
    "mouseIsPressed",
    "mouseX",
    "mouseY",
    "movedX",
    "movedY",
    "pmouseX",
    "pmouseY",
    "pwinMoueX",
    "pwinMouseY",
    "winMouseX",
    "winMouseY",

    "touches",

    "shuffle",

    "getItem",

    "isLooping",
  ]

	let dummy = new p5((p)=>{p.setup = function () {
    let c = p.createCanvas(100, 100);
    c.hide(); // p5 has a built-in `.hide()` method
  };});
  //console.log(dummy.canvas)
  //dummy.canvas.style.display = 'none';
  let proto = Object.getPrototypeOf(dummy);
  let keys = Object.getOwnPropertyNames(proto);

  for(let k of keys){
    let external = pool.find(ext => ext.name===k);
    if(external){
      pool = pool.filter(ext => ext!==external);
    }
  }

  for(let al of p5BuiltIns){
    let ext = ExternalBuilder(typeof proto[al] === "function"?al+"()":al,{},pool).build();
    //console.log(ext);
    let deepness = 0;
    let visits = [];
    function externProperties(obj,title){
      if(visits.includes(obj)){
        return;
      }
      let props=Object.getOwnPropertyNames(obj);
      for(let prop of props){
        let subtitle = "";
        if(!["caller","callee","arguments"].includes(prop)){
          let obj2;
          try{
            obj2 = obj[prop];
          }catch(e){
            obj2 = undefined;
          }
          if(prop==="prototype"){
            subtitle = title.substring(0,title.length-1).split(".").splice(0,title.substring(0,title.length-1).split(".").length-1).join(".")+"._"+title.substring(0,title.length-1).split(".")[title.substring(0,title.length-1).split(".").length-1].substring(0,title.length-1).toLowerCase()+"_";
            if(subtitle[0]==='.'){
              subtitle=subtitle.substring(1,subtitle.length);
            }
          }else{
            subtitle = title+prop;
            //console.log(subtitle);
          }
          ExternalBuilder(typeof obj2 === "function"?subtitle+"()":subtitle,{},pool).build();
          if(typeof obj2 === "object" || typeof obj2 === "function"){
            let tit = subtitle+".";
            visits.push(obj);
            deepness++;
            if(obj[prop]) externProperties(obj2,tit);
            deepness--;
            visits.pop();
          }
        }
      }
    }
    let obj = proto[al];
    if(obj){
      let title = al+"."
      externProperties(obj,title);
    }
  }

  for(let d of p5Dynamics){
    let external = pool.find(ext => ext.name===d);
    let _dynamic_ = pool.find(ext => ext.name ==="_Dynamic_").properties.any
    if(external){
      switch(external.type){
        case "Literal":
        case "Array":
        case "Object":
          external = _dynamic_;
          break;
        case "Evaluation":
          external.construct = ()=>{return _dynamic_};
          external.call = ()=>{return _dynamic_};
          break;
      }
    }
  }
  
  return pool;
}

extPool1 = getExternals1();
extPool2 = getExternals2();