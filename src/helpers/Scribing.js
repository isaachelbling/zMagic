const _ = require('lodash')
const yaml = require('js-yaml')
const jp = require('fs-jetpack')

const Book = require('./Book')

const triggerTickPath = './data/zmagic/functions/triggers/scribing/tick.mcfunction'
const initPath        = './data/zmagic/functions/init/scribing.mcfunction'
const scribePath        = './data/zmagic/functions/scribe/'
const givePath        = './data/zmagic/functions/give/page/'

class Scribing {
  constructor() {
    this.writeInit   = this.writeInit.bind(this)
    this.writeTick   = this.writeTick.bind(this)
    this.writeGivers = this.writeGivers.bind(this)

    this.scribingPaper = 'minecraft:paper{display:{Name:"{\\"text\\":\\"Scribing Paper\\"}"}}'

    this.papers = [
      {
        name: 'Ignus Page',
        enchantId: 1,
        triggerObjective: 'scrIgnusPage',
        reagent: 'blaze_powder',
        tiers: [
          {
            name: 'I',
            trigger: 10,
            lore: 'Page detailing basic Ignan spellcasting.'
          },
          {
            name: 'II',
            trigger: 11,
            lore: 'Page detailing intermediate Ignan spellcasting.'
          },
          {
            name: 'III',
            trigger: 12,
            lore: 'Page detailing advanced Ignan spellcasting.'
          }
        ]
      }
    ]

  }

  getIngredientsScores(paper, index) {
    let ingredients = ''
    switch(index) {
      case 0:
        ingredients = `${paper.reagent}=8..,scribingPaper=1..`
        break;
      case 1:
        ingredients = `${_.camelCase(paper.name)+'I'}=4..,scribingPaper=1..`
        break;
      case 2:
        ingredients = `${_.camelCase(paper.name)+'II'}=4..,scribingPaper=1..`
        break;
    }
    return ingredients
  }

  getIngredientsToClear(paper, index) {
    let ingredients = ''
    var line1 = `clear @s[scores={${this.getIngredientsScores(paper, index)}}] ${this.scribingPaper} 1`
    switch(index) {
      case 0:
        var line2 = `clear @s[scores={${this.getIngredientsScores(paper, index)}}] minecraft:${paper.reagent} 8`
        ingredients = line1+'\n'+line2
        break;
      case 1:
        var pageConsumed = `minecraft:paper{ench:[{id:${paper.enchantId},lvl:${index-1}}]}`
        var line2 = `clear @s[scores={${this.getIngredientsScores(paper, index)}}] ${pageConsumed} 4`
        ingredients = line1+'\n'+line2
        break;
      case 2:
        var pageConsumed = `minecraft:paper{ench:[{id:${paper.enchantId},lvl:${index-1}}]}`
        var line2 = `clear @s[scores={${this.getIngredientsScores(paper, index)}}] ${pageConsumed} 4`
        ingredients = line1+'\n'+line2
        break;
    }
    return ingredients
  }

  writeInit() {
    let lines = []
    this.papers.forEach(paper => {
      lines.push(`scoreboard objectives add scribePage trigger`)
      lines.push(`scoreboard objectives add scribingPaper dummy`)
      paper.tiers.forEach((tier, index) => {
        const item = `minecraft:paper{ench:[{id:${paper.enchantId},lvl:${index}}]}`
        const line = `scoreboard objectives add ${_.camelCase(paper.name)+tier.name} dummy`

        lines.push(line)
      })
    })
    console.log('  '+initPath);
    jp.write(initPath, lines.join('\n'))
  }

  writeTick() {
    let lines = []
    this.papers.forEach(paper => {
      lines.push(`scoreboard players enable @a scribePage`)
      lines.push(`execute as @a store result score @s scribingPaper run clear @s ${this.scribingPaper} 0`)
      paper.tiers.forEach((tier, index) => {
        const ingredients = this.getIngredientsScores(paper, index)
        const execute = `execute at @a[scores={scribePage=${tier.trigger},${ingredients}}] run`
        const mcfunction = `function zmagic:scribe/${_.snakeCase(paper.name+tier.name)}`
        const line = `${execute} ${mcfunction}`
        lines.push(line)
      })
      lines.push(`scoreboard players set @a[scores={scribePage=1..}] scribePage -1`)
    })
    console.log('  '+triggerTickPath);
    jp.write(triggerTickPath, lines.join('\n'))
  }

  writeScribers() {
    this.papers.forEach(paper => {
      paper.tiers.forEach((tier, index) => {
        let color = ''
        switch(index) {
          case 0:
            color = 'green'
            break;
          case 1:
            color = 'aqua'
            break;
          case 2:
            color = 'light_purple'
            break;
        }

        const id = _.snakeCase(paper.name+tier.name)

        const give = `execute as @s[scores={${this.getIngredientsScores(paper, index)}}] run function zmagic:give/page/${id}`
        const line1 = `${give}`
        // const line2 = `clear @s minecraft:paper 1`
        const pageConsumed = `minecraft:paper{ench:[{id:${paper.enchantId},lvl:${index}}]}`
        const line3 = this.getIngredientsToClear(paper, index)

        const lines = [
          this.getIngredientsToClear(paper, index),
          `${give}`,
        ]

        const writePath = `${scribePath}${id}.mcfunction`
        console.log('  '+writePath);
        // console.log(lines.join('\n'));
        jp.write(writePath, lines.join('\n'))
      })
    })
  }

  writeGivers() {
    this.papers.forEach(paper => {
      paper.tiers.forEach((tier, index) => {
        let color = ''
        switch(index) {
          case 0:
            color = 'green'
            break;
          case 1:
            color = 'aqua'
            break;
          case 2:
            color = 'light_purple'
            break;
        }

        const id = _.snakeCase(paper.name+tier.name)

        const give = `give @s minecraft:paper`
        const nbt = `{display: {Name: "{\\"text\\":\\"${paper.name} ${tier.name}\\",\\"color\\":\\"${color}\\"}", Lore:["${tier.lore}"]}, ench:[{id:${paper.enchantId},lvl:${index}}], HideFlags:1 }`
        const line = `${give}${nbt}`

        const lines = [
          line
        ]

        const writePath = `${givePath}${id}.mcfunction`
        console.log('  '+writePath);
        jp.write(writePath, lines.join('\n'))
      })
    })
  }
}


module.exports = Scribing
