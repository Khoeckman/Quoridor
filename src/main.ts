import MainModuleFactory from '../cpp/build/main.js'

const module = await MainModuleFactory()

console.log(module.add(3, 4.5))
