/**
 * Arquivo para gerar os UnitTest relacionas a App
 */
const test = require('tape');
const sinon = require('sinon');
const service = require('../service/roboService');
const moment = require('moment');

//---------------------------------------------------------------------
// Test to Check When Start Process
//---------------------------------------------------------------------
test("Check Start Process", (t) => {

    var now = moment();
    var currentHour = now.hour();

    if (currentHour >= 8) {
        // Retorna true se o horário atual for maior ou igual que 08:00 AM
        t.true(service.checkStartProcess(8), "Check hora de Inicio!");

    } else {
        // Retorna true se o horário atual for maior ou igual que 08:00 AM
        t.false(service.checkStartProcess(8), "Check hora de Inicio!");
    }

    t.end();
});

test("Check Start Process sem parâmetro", (t) => {
    try {
        service.checkStartProcess();
    } catch (error) {
        t.assert(error, "initial hour is mandatory!");
        t.end();
    }
});

//---------------------------------------------------------------------
// Test to Check When End Process
//---------------------------------------------------------------------
test("Check End Process", (t) => {

    var now = moment();
    var currentHour = now.hour();

    if (currentHour <= 18) {
        t.true(service.checkEndProcess(18), "Check hora de Termino!");

    } else {
        t.false(service.checkEndProcess(18), "Check hora de Termino!");
    }
    t.end();
});

test("Check End Process sem parâmetro", (t) => {
    try {
        service.checkEndProcess();
    } catch (error) {
        t.assert(error, "end hour is mandatory!");
        t.end();
    }
});

//---------------------------------------------------------------------
// Test Request Loop
//---------------------------------------------------------------------
test("Fake Request Loop", (t) => {
    try {

        // 2000 miliseconds
        t.pass(service.fakeRequestloop(2000));

    } catch (error) {
        t.assert(error, "end hour is mandatory!");
        t.end();
    }
});