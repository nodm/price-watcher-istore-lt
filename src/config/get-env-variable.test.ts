import { getEnvVariable, EnvVariable } from './get-env-variable';

describe('get-env-variable', () => {
  const definedVariableName = EnvVariable.TELEGRAM_INCOMING_MESSAGE_QUEUE_URL;
  const definedVariableValue = process.env[definedVariableName];

  const missingVariableName = EnvVariable.TELEGRAM_OUTGOING_MESSAGE_QUEUE_URL;
  const missingVariableValue = process.env[missingVariableName];

  const value = 'DEFINED_ENV_VARIABLE_VALUE';

  beforeEach(() => {
    process.env[definedVariableName] = value;
    if (missingVariableName in process.env) {
      delete process.env[missingVariableName];
    }
  });

  afterEach(() => {
    jest.clearAllMocks();

    if (definedVariableValue) {
      process.env[definedVariableName] = definedVariableValue;
    } else {
      delete process.env[definedVariableName];
    }

    if (missingVariableValue) {
      process.env[missingVariableName] = missingVariableValue;
    } else {
      delete process.env[missingVariableName];
    }
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return a value of an env variable if it is defined', () => {
    expect(getEnvVariable(definedVariableName)).toEqual(value);
  });

  it('should throw an error if a mandatory env variable is not defined', () => {
    expect(() => getEnvVariable(missingVariableName))
      .toThrow(`Variable "${missingVariableName}" is not defined in the environment`);
  });

  it('should return "undefined" if an optional env variable is not defined', () => {
    expect(getEnvVariable(missingVariableName, true)).toBe(undefined);
  });
});
