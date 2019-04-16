import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';

const defaultConfiguration = {
    "configurations": [],
    "compounds": []
};

const validConfiguration = {
    "name": "Launch Program",
    "program": "${file}",
    "request": "launch",
    "type": "node",
};

const validConfiguration2 = {
    "name": "Launch Program 2",
    "program": "${file}",
    "request": "launch",
    "type": "node",
};

const bogusConfiguration = {};

const validCompound = {
    "name": "Compound",
    "configurations": [
        "Launch Program",
        "Launch Program 2"
    ]
};

const bogusCompound = {};

const bogusCompound2 = {
    "name": "Compound 2",
    "configurations": [
        "Foo",
        "Launch Program 2"
    ]
};

const rootUri = vscode.workspace.workspaceFolders![0].uri;
const launchPath = rootUri.fsPath + '/.vscode/launch.json';
const settingsPath = rootUri.fsPath + '/.vscode/settings.json';

testSuite({
    name: 'No Preferences',
    expectation: defaultConfiguration
});

testLaunchAndSettingsSuite({
    name: 'Empty With Version',
    launch: {
        "version": "0.2.0"
    },
    expectation: {
        "version": "0.2.0",
        "configurations": [],
        "compounds": []
    }
});

testLaunchAndSettingsSuite({
    name: 'Empty With Version And Configurations',
    launch: {
        "version": "0.2.0",
        "configurations": [],
    },
    expectation: {
        "version": "0.2.0",
        "configurations": [],
        "compounds": []
    }
});

testLaunchAndSettingsSuite({
    name: 'Empty With Version And Compounds',
    launch: {
        "version": "0.2.0",
        "compounds": []
    },
    expectation: {
        "version": "0.2.0",
        "configurations": [],
        "compounds": []
    }
});

testLaunchAndSettingsSuite({
    name: 'Valid Conf',
    launch: {
        "version": "0.2.0",
        "configurations": [validConfiguration]
    },
    expectation: {
        "version": "0.2.0",
        "configurations": [validConfiguration],
        "compounds": []
    }
});

testLaunchAndSettingsSuite({
    name: 'Bogus Conf',
    launch: {
        "version": "0.2.0",
        "configurations": [validConfiguration, bogusConfiguration]
    },
    expectation: {
        "version": "0.2.0",
        "configurations": [validConfiguration, bogusConfiguration],
        "compounds": []
    }
});

testLaunchAndSettingsSuite({
    name: 'Valid Compound',
    launch: {
        "version": "0.2.0",
        "configurations": [validConfiguration, validConfiguration2],
        "compounds": [validCompound]
    },
    expectation: {
        "version": "0.2.0",
        "configurations": [validConfiguration, validConfiguration2],
        "compounds": [validCompound]
    }
});

testLaunchAndSettingsSuite({
    name: 'Valid And Bogus',
    launch: {
        "version": "0.2.0",
        "configurations": [validConfiguration, validConfiguration2, bogusConfiguration],
        "compounds": [validCompound, bogusCompound, bogusCompound2]
    },
    expectation: {
        "version": "0.2.0",
        "configurations": [validConfiguration, validConfiguration2, bogusConfiguration],
        "compounds": [validCompound, bogusCompound, bogusCompound2]
    }
});

testSuite({
    name: 'Mixed',
    launch: {
        "version": "0.2.0",
        "configurations": [validConfiguration, bogusConfiguration],
        "compounds": [bogusCompound, bogusCompound2]
    },
    settings: {
        launch: {
            "version": "0.2.0",
            "configurations": [validConfiguration2],
            "compounds": [validCompound]
        }
    },
    expectation: {
        "version": "0.2.0",
        "configurations": [validConfiguration, bogusConfiguration],
        "compounds": [bogusCompound, bogusCompound2]
    }
});

function testLaunchAndSettingsSuite({
    name, expectation, launch
}: {
    name: string,
    expectation: any,
    launch?: any
}): void {
    testSuite({
        name: name + ' Launch Configuration',
        launch,
        expectation
    });
    testSuite({
        name: name + ' Settings Configuration',
        settings: {
            "launch": launch
        },
        expectation
    });
};

function testSuite({
    name, expectation, settings, launch
}: {
    name: string,
    expectation: any,
    launch?: any,
    settings?: any
}): void {

    suite(name, () => {

        const cleanUp = () => {
            let r = false;
            try {
                if (fs.existsSync(launchPath)) {
                    fs.unlinkSync(launchPath);
                    r = true;
                }
            } catch { /*no-op*/ }
            try {
                if (fs.existsSync(settingsPath)) {
                    fs.unlinkSync(settingsPath);
                    r = true;
                }
            } catch { /*no-op*/ }
            return r;
        };

        setup(async () => {
            const whenDidChangeLaunchConfiguration = new Promise(resolve => vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('launch')) {
                    resolve();
                }
            }));
            let r = cleanUp();
            if (settings) {
                fs.writeFileSync(settingsPath, JSON.stringify(settings), 'utf-8');
                r = true;
            }
            if (launch) {
                fs.writeFileSync(launchPath, JSON.stringify(launch), 'utf-8');
                r = true;
            }
            if (r) {
                await whenDidChangeLaunchConfiguration;
            }
        });

        teardown(async () => {
            const whenDidChangeLaunchConfiguration = new Promise(resolve => vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('launch')) {
                    resolve();
                }
            }));
            if (cleanUp()) {
                await whenDidChangeLaunchConfiguration;
            }
        });

        test('default', () => {
            const config = vscode.workspace.getConfiguration('launch');
            assert.deepEqual(expectation, JSON.parse(JSON.stringify(config)));
        });

        test('undefind', () => {
            const config = vscode.workspace.getConfiguration('launch', undefined);
            assert.deepEqual(expectation, JSON.parse(JSON.stringify(config)));
        });

        test('null', () => {
            const config = vscode.workspace.getConfiguration('launch', null);
            assert.deepEqual(expectation, JSON.parse(JSON.stringify(config)));
        });

        test('rootUri', () => {
            const config = vscode.workspace.getConfiguration('launch', rootUri);
            assert.deepEqual(expectation, JSON.parse(JSON.stringify(config)));
        });

        test('inspect', () => {
            const config = vscode.workspace.getConfiguration();
            const inspect = config.inspect('launch');
            const inspectExpectation = {
                key: 'launch',
                defaultValue: defaultConfiguration,
                globalValue: defaultConfiguration,
            };
            const workspaceValue = launch || settings && settings.launch;
            if (workspaceValue !== undefined) {
                Object.assign(inspectExpectation, { workspaceValue });
            }
            assert.deepEqual(inspectExpectation, JSON.parse(JSON.stringify(inspect)));
        });

    });

};