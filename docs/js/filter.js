function parse_range(raw_str) {
    const single_number_pattern = /(?<![0-9\-])\d+(?![0-9\-])/;
    const range_pattern = /\d+-\d+/;

    let result = new Set();

    let single_numbers = range_str.match(single_number_pattern);
    let ranges = range_str.match(range_pattern);
}

function searchES() {
    let range_set = parse_range(filter_input.value);
}

$.ready(function() {
    ;
});
