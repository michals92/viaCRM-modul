<?php

namespace Espo\Modules\Viacrm\Tools\DynamicLogic;

enum Type: string {
	case And = 'and';
	case Or = 'or';
	case Not = 'not';
	case Equals = 'equals';
	case NotEquals = 'notEquals';
	case IsEmpty = 'isEmpty';
	case IsNotEmpty = 'isNotEmpty';
	case IsTrue = 'isTrue';
	case IsFalse = 'isFalse';
	case Contains = 'contains';
	case Has = 'has';
	case NotContains = 'notContains';
	case NotHas = 'notHas';
	case StartsWith = 'startsWith';
	case EndsWith = 'endsWith';
	case Matches = 'matches';
	case GreaterThan = 'greaterThan';
	case LessThan = 'lessThan';
	case GreaterThanOrEquals = 'greaterThanOrEquals';
	case LessThanOrEquals = 'lessThanOrEquals';
	case In = 'in';
	case NotIn = 'notIn';
	case IsToday = 'isToday';
	case InFuture = 'inFuture';
	case InPast = 'inPast';
}
