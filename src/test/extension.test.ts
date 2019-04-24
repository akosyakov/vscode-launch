import * as path from 'path';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs-extra';

const defaultLaunch = {
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
const validLaunch = {
    configurations: [validConfiguration, validConfiguration2],
    compounds: [validCompound]
};

const rootUri = vscode.workspace.workspaceFolders![0].uri;
const confPath = path.join(rootUri.fsPath, '.vscode');
const launchPath = path.join(confPath, 'launch.json');
const settingsPath = path.join(confPath, 'settings.json');

testSuite({
    name: 'No Preferences',
    expectation: defaultLaunch
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
    name: 'Completely Bogus Conf',
    launch: {
        "version": "0.2.0",
        "configurations": { 'valid': validConfiguration, 'bogus': bogusConfiguration }
    },
    expectation: {
        "version": "0.2.0",
        "configurations": { 'valid': validConfiguration, 'bogus': bogusConfiguration },
        "compounds": []
    }
});

const arrayBogusLaunch = [
    "version", "0.2.0",
    "configurations", { 'valid': validConfiguration, 'bogus': bogusConfiguration }
];
testSuite({
    name: 'Array Bogus Conf Launch Configuration',
    launch: arrayBogusLaunch,
    expectation: {
        "0": "version",
        "1": "0.2.0",
        "2": "configurations",
        "3": { 'valid': validConfiguration, 'bogus': bogusConfiguration },
        "compounds": [],
        "configurations": []
    }
});
testSuite({
    name: 'Array Bogus Conf Settings Configuration',
    settings: {
        "launch": arrayBogusLaunch
    },
    expectation: {}
});

testSuite({
    name: 'Null Bogus Conf Launch Configuration',
    launch: null,
    expectation: {
        "compounds": [],
        "configurations": []
    }
});
testSuite({
    name: 'Null Bogus Conf Settings Configuration',
    settings: {
        "launch": null
    },
    expectation: {}
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

testSuite({
    name: 'Mixed Launch Without Configurations',
    launch: {
        "version": "0.2.0",
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
        "configurations": [validConfiguration2],
        "compounds": [bogusCompound, bogusCompound2]
    },
    inspectExpectation: {
        key: 'launch',
        defaultValue: defaultLaunch,
        workspaceValue: {
            "version": "0.2.0",
            "configurations": [validConfiguration2],
            "compounds": [bogusCompound, bogusCompound2]
        }
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
    name, expectation, settings, launch, inspectExpectation
}: {
        name: string,
        expectation: any,
        launch?: any,
        settings?: any,
        inspectExpectation?: any
    }): void {

    suite(name, () => {

        const settingsLaunch = settings ? settings['launch'] : undefined;

        setup(async function () {
            this.timeout(2500);
            fs.emptyDirSync(rootUri.fsPath);
            fs.ensureDirSync(confPath);
            if (settings) {
                fs.writeFileSync(settingsPath, JSON.stringify(settings), 'utf-8');
            }
            if (launch) {
                fs.writeFileSync(launchPath, JSON.stringify(launch), 'utf-8');
            }
            await Promise.race([new Promise(resolve => {
                const listener = vscode.workspace.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration('launch')) {
                        listener.dispose();
                        resolve();
                    }
                });
            }), new Promise(resolve => setTimeout(resolve, 2000))]);
        });

        test('default', () => {
            const config = vscode.workspace.getConfiguration('launch');
            assert.deepEqual(JSON.parse(JSON.stringify(config)), expectation);
        });

        test('undefined', () => {
            const config = vscode.workspace.getConfiguration('launch', undefined);
            assert.deepEqual(JSON.parse(JSON.stringify(config)), expectation);
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
            let expected = inspectExpectation;
            if (!expected) {
                expected = {
                    key: 'launch',
                    defaultValue: defaultLaunch
                };
                const workspaceValue = launch || settings && settings.launch;
                if (workspaceValue !== undefined) {
                    Object.assign(expected, { workspaceValue });
                }
            }
            assert.deepEqual(JSON.parse(JSON.stringify(inspect)), expected);
        });

        test('inspect configurations', () => {
            const config = vscode.workspace.getConfiguration('launch', rootUri);
            const inspect = config.inspect('configurations');

            let expected = {
                key: 'launch.configurations',
                defaultValue: defaultLaunch.configurations
            };
            if (inspectExpectation) {
                Object.assign(expected, {
                    workspaceValue: inspectExpectation.workspaceValue.configurations,
                    workspaceFolderValue: inspectExpectation.workspaceValue.configurations
                });
            } else {
                const value = launch || settings && settings.launch;
                const configurations = !!value && 'configurations' in value ? value.configurations : undefined;
                if (configurations !== undefined) {
                    Object.assign(expected, {
                        workspaceValue: configurations,
                        workspaceFolderValue: configurations
                    });
                }
            }
            assert.deepEqual(JSON.parse(JSON.stringify(inspect)), expected);
        });

        test('inspect compounds', () => {
            const config = vscode.workspace.getConfiguration('launch', rootUri);
            const inspect = config.inspect('compounds');
            const inspectExpectation = {
                key: 'launch.compounds',
                defaultValue: defaultLaunch.compounds
            };
            const value = launch || settings && settings.launch;
            const compounds = !!value && 'compounds' in value ? value.compounds : undefined;
            if (compounds !== undefined) {
                Object.assign(inspectExpectation, {
                    workspaceValue: compounds,
                    workspaceFolderValue: compounds
                });
            }
            assert.deepEqual(inspectExpectation, JSON.parse(JSON.stringify(inspect)));
        });

        test('update launch', async () => {
            const config = vscode.workspace.getConfiguration();
            await config.update('launch', validLaunch);

            const inspect = config.inspect('launch');
            const actual = inspect && inspect.workspaceValue;
            const expected = settingsLaunch && !Array.isArray(settingsLaunch) ? { ...settingsLaunch, ...validLaunch } : validLaunch;
            assert.deepStrictEqual(actual, expected);
        });

        test('update launch Global', async () => {
            const config = vscode.workspace.getConfiguration();
            try {
                await config.update('launch', validLaunch, vscode.ConfigurationTarget.Global);
                assert.ok(false);
            } catch {
                assert.ok(true);
            }
        });

        test('update launch Workspace', async () => {
            const config = vscode.workspace.getConfiguration();
            await config.update('launch', validLaunch, vscode.ConfigurationTarget.Workspace);

            const inspect = config.inspect('launch');
            const actual = inspect && inspect.workspaceValue;
            const expected = settingsLaunch && !Array.isArray(settingsLaunch) ? { ...settingsLaunch, ...validLaunch } : validLaunch;
            assert.deepStrictEqual(actual, expected);
        });

        test('update launch WorkspaceFolder', async () => {
            const config = vscode.workspace.getConfiguration();
            try {
                await config.update('launch', validLaunch, vscode.ConfigurationTarget.WorkspaceFolder);
                assert.ok(false);
            } catch {
                assert.ok(true);
            }
        });

        test('update launch WorkspaceFolder with resource', async () => {
            const config = vscode.workspace.getConfiguration(undefined, rootUri);
            await config.update('launch', validLaunch, vscode.ConfigurationTarget.WorkspaceFolder);

            const inspect = config.inspect('launch');
            const actual = inspect && inspect.workspaceValue;
            const expected = settingsLaunch && !Array.isArray(settingsLaunch) ? { ...settingsLaunch, ...validLaunch } : validLaunch;
            assert.deepStrictEqual(actual, expected);
        });

        if (!Array.isArray(launch)) {
            test('update launch.configurations', async () => {
                const config = vscode.workspace.getConfiguration();
                await config.update('launch.configurations', [validConfiguration, validConfiguration2]);

                const inspect = config.inspect('launch');
                const actual = inspect && inspect.workspaceValue;
                const expected = launch || (!Array.isArray(settingsLaunch) ? settingsLaunch : undefined);
                assert.deepStrictEqual(actual, {
                    ...expected,
                    configurations: [validConfiguration, validConfiguration2]
                });
            });

            test('update configurations', async () => {
                /*
                 * without rootUri:
                 * [undefined_publisher.vscode-launch] Accessing a resource scoped configuration without providing a resource is not expected. To get the effective value for 'launch', provide the URI of a resource or 'null' for any resource.
                 */
                const config = vscode.workspace.getConfiguration('launch', rootUri);
                await config.update('configurations', [validConfiguration, validConfiguration2]);

                const inspect = config.inspect('configurations');
                const actual = inspect && inspect.workspaceValue;
                assert.deepStrictEqual(actual, [validConfiguration, validConfiguration2]);
            });
        }

        test('delete launch', async () => {
            const config = vscode.workspace.getConfiguration();
            await config.update('launch', undefined);
            const actual = config.inspect('launch');
            assert.deepStrictEqual(actual && actual.workspaceValue, settings ? settings['launch'] : undefined);
        });

        if ((launch && !Array.isArray(launch)) || (settingsLaunch && !Array.isArray(settingsLaunch))) {
            test('delete launch.configurations', async () => {
                const config = vscode.workspace.getConfiguration();
                await config.update('launch.configurations', undefined);

                const actual = config.inspect('launch');
                const actualWorkspaceValue = actual && actual.workspaceValue;

                let expected = undefined;
                if (launch) {
                    expected = { ...launch };
                    delete expected['configurations'];
                }
                if (settings) {
                    let settingsLaunch = undefined;
                    if (typeof settings['launch'] === 'object' && !Array.isArray(settings['launch']) && settings['launch'] !== null) {
                        settingsLaunch = settings['launch'];
                    } else {
                        settingsLaunch = expectation;
                    }
                    if (expected) {
                        if (settingsLaunch.configurations !== undefined) {
                            expected.configurations = settingsLaunch.configurations;
                        }
                    } else {
                        expected = settingsLaunch;
                    }
                }

                assert.deepStrictEqual(actualWorkspaceValue, expected);
            });
        }

    });

};
