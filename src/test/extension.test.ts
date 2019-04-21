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
const validLaunch = {
    configurations: [validConfiguration, validConfiguration2],
    compounds: [validCompound]
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

        setup(async function () {
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

        teardown(async function () {
            const whenDidChangeLaunchConfiguration = new Promise(resolve => vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('launch')) {
                    resolve();
                }
            }));
            if (cleanUp()) {
                await Promise.race([whenDidChangeLaunchConfiguration, new Promise(resolve => setTimeout(resolve, 1000))]);
            }
        });

        test('default', () => {
            const config = vscode.workspace.getConfiguration('launch');
            assert.deepEqual(expectation, JSON.parse(JSON.stringify(config)));
        });

        test('undefined', () => {
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
                defaultValue: defaultConfiguration
            };
            const workspaceValue = launch || settings && settings.launch;
            if (workspaceValue !== undefined) {
                Object.assign(inspectExpectation, { workspaceValue });
            }
            assert.deepEqual(inspectExpectation, JSON.parse(JSON.stringify(inspect)));
        });

        test('inspect configurations', () => {
            const config = vscode.workspace.getConfiguration('launch', rootUri);
            const inspect = config.inspect('configurations');
            const inspectExpectation = {
                key: 'launch.configurations',
                defaultValue: defaultConfiguration.configurations
            };
            const value = launch || settings && settings.launch;
            const configurations = !!value && 'configurations' in value ? value.configurations : undefined;
            if (configurations !== undefined) {
                Object.assign(inspectExpectation, {
                    workspaceValue: configurations,
                    workspaceFolderValue: configurations
                });
            }
            assert.deepEqual(inspectExpectation, JSON.parse(JSON.stringify(inspect)));
        });

        test('inspect compounds', () => {
            const config = vscode.workspace.getConfiguration('launch', rootUri);
            const inspect = config.inspect('compounds');
            const inspectExpectation = {
                key: 'launch.compounds',
                defaultValue: defaultConfiguration.compounds
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
            assert.ok(fs.existsSync(launchPath), 'launch.json should exist');
            const actual = JSON.parse(fs.readFileSync(launchPath, { encoding: 'utf-8' }));
            assert.deepStrictEqual(validLaunch, actual);
        });

        test('update launch Global', async () => {
            const config = vscode.workspace.getConfiguration();
            try {
                await config.update('launch', validLaunch, vscode.ConfigurationTarget.Global);
                assert.fail('should not be possible to update User Settings');
            } catch (e) {
                assert.deepStrictEqual(e.message, 'Unable to write to User Settings because undefined does not support for global scope.');
            }
        });

        test('update launch Workspace', async () => {
            const config = vscode.workspace.getConfiguration();
            await config.update('launch', validLaunch, vscode.ConfigurationTarget.Workspace);
            assert.ok(fs.existsSync(launchPath), 'launch.json should exist');
            const actual = JSON.parse(fs.readFileSync(launchPath, { encoding: 'utf-8' }));
            assert.deepStrictEqual(validLaunch, actual);
        });

        test('update launch WorkspaceFolder', async () => {
            const config = vscode.workspace.getConfiguration();
            try {
                await config.update('launch', validLaunch, vscode.ConfigurationTarget.WorkspaceFolder);
                assert.fail('should not be possible to update Workspace Folder Without resource');
            } catch (e) {
                assert.deepStrictEqual(e.message, 'Unable to write to Folder Settings because no resource is provided.');
            }
        });

        test('update launch WorkspaceFolder with resource', async () => {
            const config = vscode.workspace.getConfiguration(undefined, rootUri);
            await config.update('launch', validLaunch, vscode.ConfigurationTarget.WorkspaceFolder);
            assert.ok(fs.existsSync(launchPath), 'launch.json should exist');
            const actual = JSON.parse(fs.readFileSync(launchPath, { encoding: 'utf-8' }));
            assert.deepStrictEqual(validLaunch, actual);
        });

        if (!Array.isArray(launch)) { // Error: Can not add index to parent of type array
            test('update launch.configurations', async () => {
                const config = vscode.workspace.getConfiguration();
                await config.update('launch.configurations', [validConfiguration, validConfiguration2]);
                const configPath = fs.existsSync(launchPath) ? launchPath : settingsPath;
                const actual = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }));
                assert.deepStrictEqual({
                    ...launch,
                    configurations: [validConfiguration, validConfiguration2]
                }, actual);
            });

            test('update configurations', async () => {
                /* 
                 * without rootUri:
                 * [undefined_publisher.vscode-launch] Accessing a resource scoped configuration without providing a resource is not expected. To get the effective value for 'launch', provide the URI of a resource or 'null' for any resource.
                 */
                const config = vscode.workspace.getConfiguration('launch', rootUri);
                await config.update('configurations', [validConfiguration, validConfiguration2]);
                const configPath = fs.existsSync(launchPath) ? launchPath : settingsPath;
                const actual = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }));
                assert.deepStrictEqual({
                    ...launch,
                    configurations: [validConfiguration, validConfiguration2]
                }, actual);
            });
        }

        test('udpate delete', async () => {
            const config = vscode.workspace.getConfiguration();
            await config.update('launch', undefined);
            assert.ok(fs.existsSync(launchPath), 'launch.json should exist');
            const actual = fs.readFileSync(launchPath, { encoding: 'utf-8' });
            assert.deepStrictEqual('', actual);
        });

    });

};