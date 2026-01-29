/**
 * environment.config.test.ts
 * Unit tests for environment configuration
 */

import { EnvironmentConfig } from "../../config/environment.config";

describe("EnvironmentConfig", () => {
  const originalEnv = process.env;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Force reset of singleton instance
    (EnvironmentConfig as any).instance = undefined;
    // Suppress console.error during tests to avoid cluttering output
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error after each test
    consoleErrorSpy.mockRestore();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      process.env.STAGE = "dev";
      process.env.PROJECT = "test-project";
      process.env.CDK_REGION = "us-east-1";
      process.env.CDK_ACCOUNT_ID = "123456789012";
      process.env.CIDR_BLOCK = "10.0.0.0/16";

      const instance1 = EnvironmentConfig.getInstance();
      const instance2 = EnvironmentConfig.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("Configuration Validation", () => {
    it("should validate correct configuration", () => {
      process.env.STAGE = "dev";
      process.env.PROJECT = "test-project";
      process.env.CDK_REGION = "us-east-1";
      process.env.CDK_ACCOUNT_ID = "123456789012";
      process.env.CIDR_BLOCK = "10.0.0.0/16";

      const config = EnvironmentConfig.getInstance();
      const env = config.getEnvironment();

      expect(env.stage).toBe("dev");
      expect(env.project).toBe("test-project");
      expect(env.region).toBe("us-east-1");
      expect(env.account).toBe("123456789012");
      expect(env.prefix).toBe("test-project-dev");
    });

    it("should reject invalid STAGE value", () => {
      process.env.STAGE = "invalid";
      process.env.PROJECT = "test-project";
      process.env.CDK_REGION = "us-east-1";
      process.env.CDK_ACCOUNT_ID = "123456789012";
      process.env.CIDR_BLOCK = "10.0.0.0/16";

      expect(() => {
        EnvironmentConfig.getInstance();
      }).toThrow("Invalid environment configuration");
    });

    it("should reject invalid CDK_ACCOUNT_ID", () => {
      process.env.STAGE = "dev";
      process.env.PROJECT = "test-project";
      process.env.CDK_REGION = "us-east-1";
      process.env.CDK_ACCOUNT_ID = "123"; // Too short
      process.env.CIDR_BLOCK = "10.0.0.0/16";

      expect(() => {
        EnvironmentConfig.getInstance();
      }).toThrow("Invalid environment configuration");
    });

    it("should reject invalid CIDR_BLOCK", () => {
      process.env.STAGE = "dev";
      process.env.PROJECT = "test-project";
      process.env.CDK_REGION = "us-east-1";
      process.env.CDK_ACCOUNT_ID = "123456789012";
      process.env.CIDR_BLOCK = "invalid-cidr";

      expect(() => {
        EnvironmentConfig.getInstance();
      }).toThrow("Invalid environment configuration");
    });

    it("should require PROJECT", () => {
      process.env.STAGE = "dev";
      process.env.PROJECT = "";
      process.env.CDK_REGION = "us-east-1";
      process.env.CDK_ACCOUNT_ID = "123456789012";
      process.env.CIDR_BLOCK = "10.0.0.0/16";

      expect(() => {
        EnvironmentConfig.getInstance();
      }).toThrow("Invalid environment configuration");
    });
  });

  describe("Environment Methods", () => {
    beforeEach(() => {
      process.env.STAGE = "dev";
      process.env.PROJECT = "test-project";
      process.env.CDK_REGION = "us-east-1";
      process.env.CDK_ACCOUNT_ID = "123456789012";
      process.env.CIDR_BLOCK = "10.0.0.0/16";
    });

    it("should correctly identify development environment", () => {
      const config = EnvironmentConfig.getInstance();
      expect(config.isDevelopment()).toBe(true);
      expect(config.isProduction()).toBe(false);
    });

    it("should correctly identify production environment", () => {
      process.env.STAGE = "prod";
      const config = EnvironmentConfig.getInstance();
      expect(config.isProduction()).toBe(true);
      expect(config.isDevelopment()).toBe(false);
    });

    it("should return correct prefix", () => {
      const config = EnvironmentConfig.getInstance();
      expect(config.getPrefix()).toBe("test-project-dev");
    });
  });

  describe("VPC Configuration", () => {
    beforeEach(() => {
      process.env.STAGE = "dev";
      process.env.PROJECT = "test-project";
      process.env.CDK_REGION = "us-east-1";
      process.env.CDK_ACCOUNT_ID = "123456789012";
      process.env.CIDR_BLOCK = "10.0.0.0/16";
    });

    it("should return VPC config with defaults", () => {
      const config = EnvironmentConfig.getInstance();
      const vpcConfig = config.getVpcConfig();

      expect(vpcConfig.cidrBlock).toBe("10.0.0.0/16");
      expect(vpcConfig.maxAzs).toBe(2);
      expect(vpcConfig.natGateways).toBe(0);
    });

    it("should accept custom VPC settings", () => {
      process.env.VPC_MAX_AZS = "3";
      process.env.VPC_NAT_GATEWAYS = "1";

      const config = EnvironmentConfig.getInstance();
      const vpcConfig = config.getVpcConfig();

      expect(vpcConfig.maxAzs).toBe(3);
      expect(vpcConfig.natGateways).toBe(1);
    });
  });

  describe("EC2 Configuration", () => {
    beforeEach(() => {
      process.env.EC2_INSTANCE_TYPE = "t4g.micro";
      process.env.EC2_KEY_NAME = "test-key";
    });

    afterAll(() => {
      delete process.env.EC2_INSTANCE_TYPE;
      delete process.env.EC2_KEY_NAME;
    });

    it("should return EC2 config with defaults", () => {
      const config = EnvironmentConfig.getInstance();
      const ec2Config = config.getEc2Config();

      expect(ec2Config.instanceType).toBe("t4g.micro");
      expect(ec2Config.keyName).toBe("test-key");
    });
  });

  describe("RDS Configuration", () => {
    beforeEach(() => {
      process.env.RDS_INSTANCE_TYPE = "t3.small";
      process.env.RDS_MULTI_AZ = "true";
      process.env.RDS_STORAGE = "50";
      process.env.RDS_DB_NAME = "mydb";
      process.env.RDS_USERNAME = "admin";
    });

    afterAll(() => {
      delete process.env.RDS_INSTANCE_TYPE;
      delete process.env.RDS_MULTI_AZ;
      delete process.env.RDS_STORAGE;
      delete process.env.RDS_DB_NAME;
      delete process.env.RDS_USERNAME;
    });

    it("should return RDS config with correct values", () => {
      const config = EnvironmentConfig.getInstance();
      const rdsConfig = config.getRdsConfig();

      expect(rdsConfig.instanceType).toBe("t3.small");
      expect(rdsConfig.multiAz).toBe(true);
      expect(rdsConfig.allocatedStorage).toBe(50);
      expect(rdsConfig.dbName).toBe("mydb");
      expect(rdsConfig.username).toBe("admin");
    });

    it("should return RDS config with defaults", () => {
      delete process.env.RDS_DB_NAME;
      delete process.env.RDS_USERNAME;
      delete process.env.RDS_INSTANCE_TYPE;
      delete process.env.RDS_MULTI_AZ;
      delete process.env.RDS_STORAGE;

      const config = EnvironmentConfig.getInstance();
      const rdsConfig = config.getRdsConfig();

      expect(rdsConfig.dbName).toBe("cdkapp");
      expect(rdsConfig.username).toBe("postgres");
      expect(rdsConfig.instanceType).toBe("t3.micro");
      expect(rdsConfig.multiAz).toBe(false);
      expect(rdsConfig.allocatedStorage).toBe(20);
    });

  });
});
