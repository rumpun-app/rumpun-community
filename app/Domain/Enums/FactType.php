<?php

namespace App\Domain\Enums;

enum FactType: string
{
    case Birth = 'birth';
    case Death = 'death';
    case Marriage = 'marriage';
    case Divorce = 'divorce';
    case Occupation = 'occupation';
    case Residence = 'residence';
    case Education = 'education';
    case Religion = 'religion';
    case Nationality = 'nationality';
    case Burial = 'burial';
    case Baptism = 'baptism';
    case Census = 'census';
    case Custom = 'custom';
}
