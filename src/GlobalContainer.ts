import * as errors from "./errors";
import {CompilerFactory} from "./factories";
import {ts, CompilerOptions} from "./typescript";
import {LanguageService, TypeChecker} from "./compiler";
import {createWrappedNode} from "./createWrappedNode";
import {ManipulationSettingsContainer} from "./ManipulationSettings";
import {FileSystemWrapper} from "./fileSystem";
import {Logger, ConsoleLogger, LazyReferenceCoordinator} from "./utils";

/**
 * @internal
 */
export interface GlobalContainerOptions {
    createLanguageService: boolean;
    typeChecker?: ts.TypeChecker;
}

/**
 * Global container.
 * @internal
 */
export class GlobalContainer {
    private readonly _manipulationSettings = new ManipulationSettingsContainer();
    private readonly _compilerFactory: CompilerFactory;
    private readonly _lazyReferenceCoordinator: LazyReferenceCoordinator;
    private readonly _languageService: LanguageService | undefined;
    private readonly _fileSystemWrapper: FileSystemWrapper;
    private readonly _compilerOptions: CompilerOptions;
    private readonly _customTypeChecker: TypeChecker | undefined;
    private readonly _logger = new ConsoleLogger();

    constructor(fileSystemWrapper: FileSystemWrapper, compilerOptions: CompilerOptions, opts: GlobalContainerOptions) {
        this._fileSystemWrapper = fileSystemWrapper;
        this._compilerOptions = compilerOptions;
        this._compilerFactory = new CompilerFactory(this);
        this._lazyReferenceCoordinator = new LazyReferenceCoordinator(this._compilerFactory);
        this._languageService = opts.createLanguageService ? new LanguageService(this) : undefined;

        if (opts.typeChecker != null) {
            errors.throwIfTrue(opts.createLanguageService, "Cannot specify a type checker and create a language service.");
            this._customTypeChecker = new TypeChecker(this);
            this._customTypeChecker.reset(() => opts.typeChecker!);
        }
    }

    /** Gets the file system wrapper. */
    get fileSystemWrapper() {
        return this._fileSystemWrapper;
    }

    /** Gets the compiler options. */
    get compilerOptions() {
        return this._compilerOptions;
    }

    /** Gets the manipulation settings. */
    get manipulationSettings() {
        return this._manipulationSettings;
    }

    /** Gets the compiler factory. */
    get compilerFactory() {
        return this._compilerFactory;
    }

    /** Gets the language service. Throws an exception if it doesn't exist. */
    get languageService() {
        if (this._languageService == null)
            throw this.getToolRequiredError("language service");

        return this._languageService;
    }

    /**
     * Gets the program.
     */
    get program() {
        if (this._languageService == null)
            throw this.getToolRequiredError("program");

        return this.languageService.getProgram();
    }

    /**
     * Gets the type checker.
     */
    get typeChecker() {
        if (this._customTypeChecker != null)
            return this._customTypeChecker;
        if (this._languageService == null)
            throw this.getToolRequiredError("type checker");

        return this.program.getTypeChecker();
    }

    /**
     * Gets the logger.
     */
    get logger() {
        return this._logger;
    }

    /** Gets the lazy reference coordinator. */
    get lazyReferenceCoordinator() {
        return this._lazyReferenceCoordinator;
    }

    /**
     * Gets if this object has a language service.
     */
    hasLanguageService() {
        return this._languageService != null;
    }

    /**
     * Gets the encoding.
     */
    getEncoding() {
        return this.compilerOptions.charset || "utf-8";
    }

    /**
     * Resets the program.
     */
    resetProgram() {
        this.languageService.resetProgram();
    }

    private getToolRequiredError(name: string) {
        return new errors.InvalidOperationError(`A ${name} is required for this operation. ` +
            "This might occur when manipulating or getting type information from a node that was not added " +
            `to a Project object and created via ${nameof(createWrappedNode)}. ` +
            `Please submit a bug report if you don't believe a ${name} should be required for this operation.`);
    }
}
