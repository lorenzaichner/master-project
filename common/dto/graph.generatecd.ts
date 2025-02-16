export interface IStartCausalDiscovery {
    delimiter: string;
    cd_algorithm: string;
    recovery_algorithm: string;
    dataType?: string;
     useGraph?: boolean;
}

export interface ICheckCausalDiscovery {
    cd_algorithm: string;
    recovery_algorithm: string;
    identifier?: String;
}

export interface IDeleteCausalDiscovery {
    cd_algorithm: String;
    recovery_algorithm: String;
    identifier: String;
}
