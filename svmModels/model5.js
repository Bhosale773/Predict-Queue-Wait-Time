var SVM = require('libsvm-js/asm');

var model5 = new SVM({
    kernel: SVM.KERNEL_TYPES.RBF, 
    type: SVM.SVM_TYPES.EPSILON_SVR	,   
    gamma: 0.167,                    
    cost: 32,
    epsilon: 0.001                      
});

module.exports = model5;