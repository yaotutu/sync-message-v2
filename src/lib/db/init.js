"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
var index_1 = require("./index");
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
// 创建用户表
function createUsersTable() {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, index_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.exec("\n        CREATE TABLE IF NOT EXISTS webhook_users (\n            id INTEGER PRIMARY KEY AUTOINCREMENT,\n            username TEXT UNIQUE NOT NULL,\n            password TEXT NOT NULL,\n            webhook_key TEXT UNIQUE NOT NULL,\n            created_at INTEGER NOT NULL\n        )\n    ")];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// 创建消息表
function createMessagesTable() {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, index_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.exec("\n        CREATE TABLE IF NOT EXISTS messages (\n            id INTEGER PRIMARY KEY AUTOINCREMENT,\n            username TEXT NOT NULL,\n            sms_content TEXT NOT NULL,\n            rec_time TEXT,\n            received_at INTEGER NOT NULL,\n            FOREIGN KEY (username) REFERENCES webhook_users(username)\n        )\n    ")];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// 创建卡密表
function createCardKeysTable() {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, index_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.exec("\n        CREATE TABLE IF NOT EXISTS card_keys (\n            id INTEGER PRIMARY KEY AUTOINCREMENT,\n            key TEXT UNIQUE NOT NULL,\n            username TEXT NOT NULL,\n            status TEXT NOT NULL DEFAULT 'unused',\n            created_at INTEGER NOT NULL,\n            used_at INTEGER,\n            FOREIGN KEY (username) REFERENCES webhook_users(username)\n        )\n    ")];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// 创建模板表
function createTemplatesTable() {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, index_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.exec("\n        CREATE TABLE IF NOT EXISTS templates (\n            id TEXT PRIMARY KEY,\n            name TEXT NOT NULL,\n            description TEXT,\n            created_at TEXT NOT NULL,\n            updated_at TEXT NOT NULL\n        )\n    ")];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// 创建规则表
function createRulesTable() {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, index_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.exec("\n        CREATE TABLE IF NOT EXISTS rules (\n            id TEXT PRIMARY KEY,\n            template_id TEXT NOT NULL,\n            type TEXT NOT NULL CHECK (type IN ('include', 'exclude')),\n            mode TEXT NOT NULL CHECK (mode IN ('simple_include', 'simple_exclude', 'regex')),\n            pattern TEXT NOT NULL,\n            description TEXT,\n            order_num INTEGER NOT NULL,\n            is_active BOOLEAN NOT NULL DEFAULT 1,\n            FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE CASCADE\n        )\n    ")];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// 创建带链接卡密表
function createCardLinksTable() {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, index_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.exec("\n        CREATE TABLE IF NOT EXISTS card_links (\n            id TEXT PRIMARY KEY,\n            key TEXT UNIQUE NOT NULL,\n            username TEXT NOT NULL,\n            app_name TEXT NOT NULL,\n            phones TEXT,\n            created_at INTEGER NOT NULL,\n            first_used_at INTEGER,\n            url TEXT NOT NULL,\n            template_id TEXT,\n            FOREIGN KEY (username) REFERENCES webhook_users(username),\n            FOREIGN KEY (template_id) REFERENCES templates(id)\n        )\n    ")];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// 初始化数据库
function initDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var dbDir, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, 8, 10]);
                    dbDir = path_1.default.join(process.cwd(), 'data');
                    if (!fs_1.default.existsSync(dbDir)) {
                        fs_1.default.mkdirSync(dbDir);
                    }
                    // 创建所有表
                    return [4 /*yield*/, createUsersTable()];
                case 1:
                    // 创建所有表
                    _a.sent();
                    return [4 /*yield*/, createMessagesTable()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, createCardKeysTable()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, createTemplatesTable()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, createRulesTable()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, createCardLinksTable()];
                case 6:
                    _a.sent();
                    console.log('数据库初始化成功');
                    return [3 /*break*/, 10];
                case 7:
                    error_1 = _a.sent();
                    console.error('数据库初始化失败:', error_1);
                    throw error_1;
                case 8:
                    // 关闭数据库连接
                    return [4 /*yield*/, (0, index_1.closeDb)()];
                case 9:
                    // 关闭数据库连接
                    _a.sent();
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    });
}
// 如果这个文件被直接运行
if (require.main === module) {
    initDatabase().catch(function (error) {
        console.error('初始化过程出错:', error);
        process.exit(1);
    });
}
