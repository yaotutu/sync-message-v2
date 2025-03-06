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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.closeDb = closeDb;
exports.sql = sql;
exports.sqlQuery = sqlQuery;
exports.sqlGet = sqlGet;
exports.transaction = transaction;
var sqlite3_1 = require("sqlite3");
var sqlite_1 = require("sqlite");
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
// 确保数据目录存在
var DATA_DIR = path_1.default.join(process.cwd(), 'data');
if (!fs_1.default.existsSync(DATA_DIR)) {
    fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
}
// 数据库文件路径
var DB_FILE = path_1.default.join(DATA_DIR, 'database.db');
// 数据库连接实例
var db = null;
// 获取数据库连接
function getDb() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!db) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, sqlite_1.open)({
                            filename: DB_FILE,
                            driver: sqlite3_1.Database
                        })];
                case 1:
                    db = _a.sent();
                    // 启用外键约束
                    return [4 /*yield*/, db.run('PRAGMA foreign_keys = ON')];
                case 2:
                    // 启用外键约束
                    _a.sent();
                    // 启用WAL模式以提高并发性能
                    return [4 /*yield*/, db.run('PRAGMA journal_mode = WAL')];
                case 3:
                    // 启用WAL模式以提高并发性能
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, db];
            }
        });
    });
}
// 关闭数据库连接
function closeDb() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!db) return [3 /*break*/, 2];
                    return [4 /*yield*/, db.close()];
                case 1:
                    _a.sent();
                    db = null;
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
// SQL 查询执行器
function sql(strings) {
    var values = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        values[_i - 1] = arguments[_i];
    }
    return __awaiter(this, void 0, void 0, function () {
        var connection, query, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    connection = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    query = strings.reduce(function (acc, str, i) { return acc + str + (values[i] !== undefined ? '?' : ''); }, '');
                    return [4 /*yield*/, connection.run.apply(connection, __spreadArray([query], values.filter(function (v) { return v !== undefined; }), false))];
                case 3: return [2 /*return*/, _a.sent()];
                case 4:
                    error_1 = _a.sent();
                    console.error('SQL error:', error_1);
                    throw error_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
// 查询多条记录
function sqlQuery(strings) {
    var values = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        values[_i - 1] = arguments[_i];
    }
    return __awaiter(this, void 0, void 0, function () {
        var connection, query, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    connection = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    query = strings.reduce(function (acc, str, i) { return acc + str + (values[i] !== undefined ? '?' : ''); }, '');
                    return [4 /*yield*/, connection.all.apply(connection, __spreadArray([query], values.filter(function (v) { return v !== undefined; }), false))];
                case 3: return [2 /*return*/, _a.sent()];
                case 4:
                    error_2 = _a.sent();
                    console.error('SQL query error:', error_2);
                    throw error_2;
                case 5: return [2 /*return*/];
            }
        });
    });
}
// 查询单条记录
function sqlGet(strings) {
    var values = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        values[_i - 1] = arguments[_i];
    }
    return __awaiter(this, void 0, void 0, function () {
        var connection, query, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    connection = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    query = strings.reduce(function (acc, str, i) { return acc + str + (values[i] !== undefined ? '?' : ''); }, '');
                    return [4 /*yield*/, connection.get.apply(connection, __spreadArray([query], values.filter(function (v) { return v !== undefined; }), false))];
                case 3: return [2 /*return*/, _a.sent()];
                case 4:
                    error_3 = _a.sent();
                    console.error('SQL get error:', error_3);
                    throw error_3;
                case 5: return [2 /*return*/];
            }
        });
    });
}
// 事务处理
function transaction(callback) {
    return __awaiter(this, void 0, void 0, function () {
        var connection, result, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    connection = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 6, , 8]);
                    return [4 /*yield*/, connection.run('BEGIN')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, callback(connection)];
                case 4:
                    result = _a.sent();
                    return [4 /*yield*/, connection.run('COMMIT')];
                case 5:
                    _a.sent();
                    return [2 /*return*/, result];
                case 6:
                    error_4 = _a.sent();
                    return [4 /*yield*/, connection.run('ROLLBACK')];
                case 7:
                    _a.sent();
                    throw error_4;
                case 8: return [2 /*return*/];
            }
        });
    });
}
