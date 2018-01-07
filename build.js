const jp = require('fs-jetpack')
const _ = require('lodash')
const yaml = require('js-yaml')

const Spell = require('./src/helpers/Spell')
const Book = require('./src/helpers/Book')
const tagHelpers = require('./src/helpers/tag')
const interpolateYaml = require('./src/helpers/interpolate-yaml')
const pipe = require('./src/helpers/pipe')

const constantsPath = './src/constants/'
const contentPath   = './src/content/'
const spellsPath    = contentPath+'/spells/'
const initsPath     = contentPath+'/init/'
const booksPath     = contentPath+'/books/'
const tagsPath      = contentPath+'/tags/'

const costTiers = require(constantsPath+'/cost-tiers.json')



const spells = {}



// TODO FUNCTIONS

// TODO RECIPES

// TODO STRUCTURES

// TODO LOOT TABLES

// TODO TRIGGERS

// TODO INIT



// TAGS

function writeTags() {
  tagHelpers.writeTickTag('./data/minecraft/tags/functions/tick.json')
  tagHelpers.writeTags(tagsPath, './data/zinnoa/tags/')
}



// SPELLS

function importSpells() {
  const spellHelpers = new Spell()
  return spellHelpers.importAll(spellsPath)
}

function processSpells(importedSpellYamls) {
  const spellHelpers = new Spell()
  const processedSpells = spellHelpers.processAll(importedSpellYamls)
  processedSpells.forEach(spell => {
    spells[spell.id] = spell
  })
  return processedSpells
}

function writeSpells(processedSpells) {
  const spellHelpers = new Spell()
  spellHelpers.writeAll(processedSpells)
}

function buildSpells() {
  pipe(
    importSpells()
    , processSpells
    , writeSpells
  )
}




// REAGENTS

function buildInitReagentScores(costTiers) {
  let lines = []
  _.forOwn(costTiers, function(value, key) {
    const line0 = `scoreboard objectives add ${value.resource} dummy`
    const line1 = `scoreboard objectives add ${value.name} dummy`
    lines.push(line0, line1)
    for (var i=0; i<value.tiers.length; i++) {
      const line = `scoreboard players set ${i} ${value.name} ${value.tiers[i]}`
      lines.push(line)
    }
  });

  const functionPath = `./data/zinnoa/functions/sys/init_reagent_scores.mcfunction`
  console.log('  '+functionPath)
  jp.write(functionPath, lines.join('\n'))
}

function buildUpdateReagentScores(costTiers) {
  let lines = []
  _.forOwn(costTiers, function(value, key) {
    const line = `execute as @a store result score @s ${value.resource} run clear @s minecraft:${value.resource} 0`
    lines.push(line)
  });
  const functionPath = `./data/zinnoa/functions/sys/update_reagent_scores.mcfunction`
  console.log('  '+functionPath)
  jp.write(functionPath, lines.join('\n'))
}

function writeScoreboards() {
  console.log('WRITING SCOREBOARDS...');
  buildInitReagentScores(costTiers)
  buildUpdateReagentScores(costTiers)
}



// BOOKS


function importBooks() {
  const bookHelpers = new Book(spells)
  return bookHelpers.importAll(booksPath)
}

function processBooks(importedBookYamls) {
  const bookHelpers = new Book(spells)
  return bookHelpers.processAll(importedBookYamls)
}

function writeBooks(processedBooks) {
  const bookHelpers = new Book(spells)
  bookHelpers.writeAll(processedBooks)
}

function buildBooks() {
  pipe(
    importBooks()
    , processBooks
    , writeBooks
  )
}



buildSpells()
buildBooks()
writeTags()
writeScoreboards()
