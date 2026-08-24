@props(['people', 'relationships'])

<div role="tree" aria-label="Family tree" class="space-y-2">
    @forelse($people as $person)
        <div role="treeitem" aria-label="{{ $person->displayName() }}" class="p-2 border rounded">
            <span class="font-medium">{{ $person->displayName() }}</span>
            @if($person->birth_date)
                <span class="text-sm text-gray-500">— {{ $person->birth_date->format('Y-m-d') }}</span>
            @endif
            @php
                $rels = $relationships->filter(fn ($r) => $r->from_person_id === $person->id || $r->to_person_id === $person->id);
            @endphp
            @if($rels->isNotEmpty())
                <ul class="ml-4 mt-1 text-sm" role="group">
                    @foreach($rels as $rel)
                        <li>
                            {{ $rel->type }}:
                            {{ $rel->fromPerson->displayName() }} → {{ $rel->toPerson->displayName() }}
                        </li>
                    @endforeach
                </ul>
            @endif
        </div>
    @empty
        <p class="text-gray-500">No people yet.</p>
    @endforelse
</div>
